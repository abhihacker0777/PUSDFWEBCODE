import "server-only";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const getEnv = (key: string, fallback?: string): string => {
  const val = process.env[key] || fallback;
  if (!val) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return val;
};

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return createSSRClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: 60 * 60 * 8, // 8-hour admin session limit
            })
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}

export function createAdminClient() {
  const url = getEnv("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const getServiceRoleClient = createAdminClient;
