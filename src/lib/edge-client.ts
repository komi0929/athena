import { createClient } from './supabase';

interface InvokeOptions {
  method?: string;
  body?: Record<string, unknown>;
}

/**
 * 堅牢なEdge Function呼び出し（Invalid JWT回避用）
 * 1. 実行前にトークンの有効期限を確認（5分前なら自動リフレッシュ）
 * 2. API Gatewayから401が返された場合、強制リフレッシュして1回だけ自動再試行
 */
export async function invokeEdgeFunction<T>(functionName: string, options?: InvokeOptions): Promise<T> {
  const supabase = createClient();
  
  const getValidToken = async (forceRefresh = false) => {
    const { data: { session: initialSession }, error } = await supabase.auth.getSession();
    let session = initialSession;
    
    if (error || !session) {
      throw new Error('未ログインです。再ログインしてください。');
    }

    const expiresAtMs = (session.expires_at || 0) * 1000;
    const isExpiringSoon = Date.now() + 5 * 60 * 1000 > expiresAtMs;

    if (forceRefresh || isExpiringSoon) {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data.session) {
        throw new Error('セッションの更新に失敗しました。再ログインしてください。');
      }
      session = data.session;
    }
    
    return session.access_token;
  };

  const makeRequest = async (token: string) => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`;
    const response = await fetch(url, {
      method: options?.method || 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    
    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
      if (!data.error && data.message) {
        data.error = data.message;
      }
    } catch {
      throw new Error(`Edge Function エラー (${response.status}): ${text.slice(0, 100)}`);
    }

    return { response, data };
  };

  // 初回試行
  let token = await getValidToken(false);
  let result = await makeRequest(token);

  // API Gateway側の厳格な検証による 401 Unauthorized / Invalid JWT トークン期限切れ時は1回のみ強制再試行
  if (result.response.status === 401 || result.data?.error === 'Invalid JWT') {
    console.warn('[Edge Client] Invalid JWT detected. Forcing token refresh and retrying...');
    token = await getValidToken(true);
    result = await makeRequest(token);
  }

  // もし再試行後もエラーなら、フロントエンドでキャッチできるように整形
  if (!result.response.ok) {
    if (!result.data.error) {
      result.data.error = `HTTP Error ${result.response.status}`;
    }
  }

  return result.data as T;
}
