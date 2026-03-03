// Supabase Edge Function: sync-x-bookmarks
// Fetches bookmarks from X API with HARD-CODED max_results=30
// Cost per call: $0.15 (30 reads × $0.005)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

// Cooldown removed — users can sync freely

interface XBookmark {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  note_tweet?: {
    text: string;
    entities?: {
      urls?: Array<{
        expanded_url: string;
        title?: string;
        description?: string;
        images?: Array<{ url: string }>;
      }>;
    };
  };
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
  // CORS — restrict to known origins
  const allowedOrigins = [
    'https://athena.hitokoto.tech',
    'http://localhost:3000',
  ];
  const origin = req.headers.get('origin') || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
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

    // Cooldown removed — users can sync freely

    // ═══ Get X Bearer Token — prefer provider_token from request body ═══
    // The Bookmarks API requires OAuth 2.0 User Context (user access token)
    // An App Bearer Token will NOT work — it must be the user's own token
    let xBearerToken: string | null = null;

    // Try to get provider_token from request body
    try {
      const body = await req.json();
      if (body?.provider_token) {
        xBearerToken = body.provider_token;
        console.log('[sync] Using provider_token from request body');
      }
    } catch {
      // No body or invalid JSON
    }

    // Fallback to env var (may still fail if it's an App token, not User token)
    if (!xBearerToken) {
      xBearerToken = Deno.env.get('X_BEARER_TOKEN') || null;
      if (xBearerToken) {
        console.log('[sync] Falling back to X_BEARER_TOKEN env var');
      }
    }

    if (!xBearerToken) {
      return new Response(JSON.stringify({ 
        error: 'X APIの認証トークンがありません。一度ログアウトしてから再度Xでログインしてください。' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ═══ Get X User ID — use /2/users/me for accuracy ═══
    // identity_data.provider_id can be unreliable (precision loss on large IDs)
    let xUserId: string | null = null;

    // Method 1: Call /2/users/me to get the real X user ID from the bearer token
    try {
      const meResponse = await fetch('https://api.twitter.com/2/users/me', {
        headers: { 'Authorization': `Bearer ${xBearerToken}` },
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        xUserId = meData.data?.id || null;
        console.log('[sync] Got X user ID from /2/users/me:', xUserId);
      } else {
        console.warn('[sync] /2/users/me failed:', meResponse.status);
      }
    } catch (e) {
      console.warn('[sync] /2/users/me network error:', e);
    }

    // Method 2: Fallback to Supabase identity data
    if (!xUserId) {
      const xIdentity = user.identities?.find(
        (id: { provider: string }) => id.provider === 'twitter'
      );
      xUserId = xIdentity?.identity_data?.sub
        || xIdentity?.identity_data?.provider_id
        || Deno.env.get('X_USER_ID')
        || null;
      console.log('[sync] Fallback X user ID from identity:', xUserId);
    }

    if (!xUserId) {
      return new Response(JSON.stringify({ 
        error: 'X API設定エラー: XユーザーIDが取得できません。X_USER_ID をシークレットに設定するか、Xで再ログインしてください。' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const xApiUrl = new URL(`https://api.twitter.com/2/users/${xUserId}/bookmarks`);
    xApiUrl.searchParams.set('max_results', '30'); // 【絶対制約】固定30件
    xApiUrl.searchParams.set('tweet.fields', 'created_at,text,author_id,entities,note_tweet');
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
      
      let errorMsg = 'X APIエラー';
      if (xResponse.status === 401 || xResponse.status === 403) {
        errorMsg = 'Xの接続が切れました。ログアウトして再度Xでログインしてください。';
      } else if (xResponse.status === 429) {
        errorMsg = 'X APIのレート制限に達しました。しばらく待ってから再試行してください。';
      } else {
        errorMsg = `X APIエラー (${xResponse.status}): ${errorText.slice(0, 100)}`;
      }
      
      return new Response(JSON.stringify({
        error: errorMsg,
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
        // Prefer note_tweet entities (long-form tweets) over base entities
        const entities = tweet.note_tweet?.entities || tweet.entities;
        // Find the best URL with a title — X Articles and link shares may have
        // title info on any URL in the array, not just the first one
        const allUrls = entities?.urls || [];
        const ogpUrl = allUrls.find((u: { title?: string }) => u.title) || allUrls[0];
        const seed = parseInt(tweet.id.slice(-6), 10) || i;

        // Use note_tweet.text for full content of long-form tweets
        // The base text field is truncated to ~280 chars + t.co URL
        const fullText = tweet.note_tweet?.text || tweet.text;

        // Distribute in a sphere
        const theta = ((seed * 0.618) % 1) * Math.PI * 2;
        const phi = Math.acos(2 * ((seed * 0.381) % 1) - 1);
        const r = 20 + (seed % 40);

        return {
          user_id: user.id,
          tweet_id: tweet.id,
          tweet_url: `https://x.com/${author?.username || 'i'}/status/${tweet.id}`,
          text: fullText,
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
      api_cost_usd: 0.1500,
    });

    return new Response(JSON.stringify({
      success: true,
      newCount: newTweets.length,
      totalFetched: tweets.length,
      newBookmarks: newTweets.length > 0
        ? newTweets.map((t: XBookmark) => ({
            tweet_id: t.id,
            text: t.text?.slice(0, 50) + '...',
          }))
        : [],
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({
      error: '同期中にエラーが発生しました',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
