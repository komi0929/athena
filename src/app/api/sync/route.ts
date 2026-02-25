import { NextRequest, NextResponse } from 'next/server';

// POST /api/sync — Proxy to Supabase Edge Function
// This route acts as a thin middleware layer for authentication
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({
        success: true,
        newCount: 0,
        totalFetched: 0,
        cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        newBookmarks: [],
        demo: true,
        message: 'デモモード: Supabase未設定のため同期をスキップしました',
      });
    }

    // Forward the authorization header from the client
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: '認証トークンがありません。再ログインしてください。' },
        { status: 401 }
      );
    }

    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-x-bookmarks`;
    console.log('[Sync] Calling Edge Function:', edgeFunctionUrl);

    let response: Response;
    try {
      response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
    } catch (fetchError) {
      // Network error connecting to Edge Function (not deployed, DNS error, etc.)
      console.error('[Sync] Failed to reach Edge Function:', fetchError);
      return NextResponse.json(
        { error: 'Edge Functionに接続できません。デプロイされているか確認してください。' },
        { status: 503 }
      );
    }

    const responseText = await response.text();
    console.log('[Sync] Edge Function response:', response.status, responseText.slice(0, 300));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Edge Function returned non-JSON (e.g. HTML error page, 404, etc.)
      const hint = response.status === 404
        ? 'Edge Functionが見つかりません。supabase functions deploy sync-x-bookmarks を実行してください。'
        : `Edge Functionがエラーを返しました (${response.status})`;
      return NextResponse.json(
        { error: hint },
        { status: response.status || 502 }
      );
    }

    if (!response.ok) {
      console.error('[Sync] Edge Function error:', response.status, data);
      // Forward the error message from Edge Function
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
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
