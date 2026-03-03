/* eslint-disable */
// Deno runtime type declarations for Supabase Edge Functions

declare module 'https://esm.sh/@supabase/supabase-js@2.97.0' {
  export function createClient(url: string, key: string, options?: Record<string, unknown>): any;
}

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): Record<string, string>;
  }

  const env: Env;

  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string },
  ): void;
}
