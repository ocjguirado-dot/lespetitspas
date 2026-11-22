import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("La connexion à Supabase n’est pas configurée.");
  }

  return createBrowserClient(config.url, config.publishableKey);
}
