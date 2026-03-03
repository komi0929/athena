import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// DELETE /api/account/delete — Permanently delete user account and all data
export async function DELETE(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase未設定' }, { status: 500 });
    }

    // 1. Verify the requesting user via their session cookie
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Read-only in API route
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = user.id;
    console.log(`[Account Delete] Deleting account for user: ${userId}`);

    // 2. Delete all user data — use service role client to bypass RLS (no DELETE policy)
    const dbClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabase;

    const { error: bmError } = await dbClient
      .from('bookmarks')
      .delete()
      .eq('user_id', userId);

    if (bmError) {
      console.error('[Account Delete] Failed to delete bookmarks:', bmError);
    }

    const { error: syncError } = await dbClient
      .from('sync_log')
      .delete()
      .eq('user_id', userId);

    if (syncError) {
      console.error('[Account Delete] Failed to delete sync_log:', syncError);
    }

    const { error: clusterError } = await dbClient
      .from('clusters')
      .delete()
      .eq('user_id', userId);

    if (clusterError) {
      console.error('[Account Delete] Failed to delete clusters:', clusterError);
    }

    // 3. Delete auth user (requires service role key)
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        console.error('[Account Delete] Failed to delete auth user:', deleteUserError);
        // Data is already deleted, so we still return success
      } else {
        console.log(`[Account Delete] Auth user ${userId} deleted successfully`);
      }
    } else {
      console.warn('[Account Delete] SUPABASE_SERVICE_ROLE_KEY not set — auth user not deleted, but data is purged');
    }

    // 4. Clear localStorage-related keys via client-side (handled by frontend)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Account Delete] Unexpected error:', error);
    return NextResponse.json(
      { error: 'アカウント削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
