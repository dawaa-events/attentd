const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export function supabaseConfigured() {
  return Boolean(url && anonKey);
}

export async function supabaseRest(path: string, init: RequestInit = {}, accessToken?: string) {
  if (!url || !anonKey) throw new Error("لم يتم ربط قاعدة البيانات بعد");
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Authorization", `Bearer ${accessToken || anonKey}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${url}${path}`, { ...init, headers, cache: "no-store" });
}

export async function supabaseAuth(path: string, init: RequestInit = {}) {
  if (!url || !anonKey) throw new Error("لم يتم ربط قاعدة البيانات بعد");
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  headers.set("Content-Type", "application/json");
  return fetch(`${url}/auth/v1${path}`, { ...init, headers, cache: "no-store" });
}
