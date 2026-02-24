// Supabase Edge Function: sync-x-bookmarks
// Fetches bookmarks from X API with HARD-CODED max_results=20
// Cost per call: $0.10 (20 reads × $0.005)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

const COOLDOWN_HOURS = 24;

interface XBookmark {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  entities?: {
    urls?: Array<{
      expanded_url: string;
      title?: string;
      description?: string;
      images?: Array<{ url: string }>;
    }>;
  };
}

interface XUser {
  id: string;
  name: string;
  username: string;
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '認証が必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'ユーザー認証失敗' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ═══ Cooldown Check ═══
    const { data: lastSync } = await supabase
      .from('sync_log')
      .select('synced_at')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    if (lastSync) {
      const lastSyncTime = new Date(lastSync.synced_at).getTime();
      const cooldownEnd = lastSyncTime + COOLDOWN_HOURS * 60 * 60 * 1000;
      const now = Date.now();

      if (now < cooldownEnd) {
        const remainMs = cooldownEnd - now;
        const remainHours = Math.ceil(remainMs / (60 * 60 * 1000));
        return new Response(JSON.stringify({
          error: 'cooldown',
          message: `次回の天体観測まで: ${remainHours}時間`,
          cooldownUntil: new Date(cooldownEnd).toISOString(),
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ═══ Fetch X API Bookmarks ═══
    // 【絶対制約】max_results=20 ハードコード
    const xBearerToken = Deno.env.get('X_BEARER_TOKEN');
    const xUserId = Deno.env.get('X_USER_ID');

    if (!xBearerToken || !xUserId) {
      return new Response(JSON.stringify({ error: 'X API credentials not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const xApiUrl = new URL(`https://api.twitter.com/2/users/${xUserId}/bookmarks`);
    xApiUrl.searchParams.set('max_results', '20'); // 【絶対制約】固定20件
    xApiUrl.searchParams.set('tweet.fields', 'created_at,text,author_id,entities');
    xApiUrl.searchParams.set('expansions', 'author_id');
    xApiUrl.searchParams.set('user.fields', 'name,username');

    const xResponse = await fetch(xApiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${xBearerToken}`,
      },
    });

    if (!xResponse.ok) {
      const errorText = await xResponse.text();
      console.error('X API error:', xResponse.status, errorText);
      return new Response(JSON.stringify({
        error: 'X API呼び出し失敗',
        status: xResponse.status,
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const xData = await xResponse.json();
    const tweets: XBookmark[] = xData.data || [];
    const users: XUser[] = xData.includes?.users || [];

    // User lookup map
    const userMap = new Map(users.map((u: XUser) => [u.id, u]));

    // ═══ Dedup — Check existing tweet_ids ═══
    const tweetIds = tweets.map((t: XBookmark) => t.id);
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('tweet_id')
      .in('tweet_id', tweetIds);

    const existingIds = new Set((existing || []).map((e: { tweet_id: string }) => e.tweet_id));
    const newTweets = tweets.filter((t: XBookmark) => !existingIds.has(t.id));

    // ═══ Insert new bookmarks ═══
    if (newTweets.length > 0) {
      // Simple seeded position placement for now
      const newBookmarks = newTweets.map((tweet: XBookmark, i: number) => {
        const author = userMap.get(tweet.author_id);
        const ogpUrl = tweet.entities?.urls?.[0];
        const seed = parseInt(tweet.id.slice(-6), 10) || i;

        // Distribute in a sphere
        const theta = ((seed * 0.618) % 1) * Math.PI * 2;
        const phi = Math.acos(2 * ((seed * 0.381) % 1) - 1);
        const r = 20 + (seed % 40);

        return {
          user_id: user.id,
          tweet_id: tweet.id,
          tweet_url: `https://x.com/${author?.username || 'i'}/status/${tweet.id}`,
          text: tweet.text,
          author_name: author?.name || 'Unknown',
          author_handle: `@${author?.username || 'unknown'}`,
          ogp_title: ogpUrl?.title || null,
          ogp_description: ogpUrl?.description || null,
          ogp_image: ogpUrl?.images?.[0]?.url || null,
          pos_x: r * Math.sin(phi) * Math.cos(theta),
          pos_y: r * Math.sin(phi) * Math.sin(theta),
          pos_z: r * Math.cos(phi),
          is_read: false,
          created_at: tweet.created_at,
          bookmarked_at: new Date().toISOString(),
        };
      });

      await supabase.from('bookmarks').insert(newBookmarks);
    }

    // ═══ Log sync ═══
    await supabase.from('sync_log').insert({
      user_id: user.id,
      new_count: newTweets.length,
      api_cost_usd: 0.1000,
    });

    return new Response(JSON.stringify({
      success: true,
      newCount: newTweets.length,
      totalFetched: tweets.length,
      cooldownUntil: new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000).toISOString(),
      newBookmarks: newTweets.length > 0
        ? newTweets.map((t: XBookmark) => ({
            tweet_id: t.id,
            text: t.text?.slice(0, 50) + '...',
          }))
        : [],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({
      error: '同期中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
