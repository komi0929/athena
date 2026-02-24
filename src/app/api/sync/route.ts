import { NextRequest, NextResponse } from 'next/server';

// POST /api/sync — Proxy to Supabase Edge Function
// This route acts as a thin middleware layer for authentication
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      // In demo mode without Supabase, return mock sync result
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
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // Call the Supabase Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-x-bookmarks`;
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: '同期リクエストの処理に失敗しました' },
      { status: 500 }
    );
  }
}
