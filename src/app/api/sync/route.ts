import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// POST /api/sync — Server-side proxy to Supabase Edge Function
// Uses server-side cookies to get a fresh JWT, then forwards it to the Edge Function
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: true,
        newCount: 0,
        cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        demo: true,
        message: 'デモモード: Supabase未設定',
      });
    }

    // ═══ Get user session from cookies (server-side) ═══
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return NextResponse.json(
        { error: '認証が必要です。再ログインしてください。' },
        { status: 401 }
      );
    }

    // ═══ Call Edge Function with the user's JWT ═══
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-x-bookmarks`;
    console.log('[Sync] Calling Edge Function with server-side JWT');

    let response: Response;
    try {
      response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
      });
    } catch (fetchError) {
      console.error('[Sync] Network error:', fetchError);
      return NextResponse.json(
        { error: 'Edge Functionに接続できません。デプロイされているか確認してください。' },
        { status: 503 }
      );
    }

    // ═══ Parse response ═══
    const responseText = await response.text();
    console.log('[Sync] Response:', response.status, responseText.slice(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      const hint = response.status === 404
        ? 'Edge Functionが見つかりません。デプロイしてください。'
        : `Edge Functionエラー (${response.status}): ${responseText.slice(0, 100)}`;
      return NextResponse.json({ error: hint }, { status: response.status || 502 });
    }

    if (!response.ok) {
      console.error('[Sync] Edge Function error:', response.status, data);
      const errorMsg = data.error || data.message || `同期エラー (${response.status})`;
      return NextResponse.json(
        { error: errorMsg, ...(data.cooldownUntil ? { cooldownUntil: data.cooldownUntil } : {}) },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Sync] Unexpected error:', error);
    const message = error instanceof Error ? error.message : '同期中に予期しないエラーが発生しました';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
