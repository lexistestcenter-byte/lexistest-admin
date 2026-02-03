import { createBrowserClient } from "@supabase/ssr";

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith("http://") || url.startsWith("https://");
  } catch {
    return false;
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_NEXT_PUBLIC_;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
    throw new Error(
      "Missing or invalid Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
