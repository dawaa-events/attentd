import { NextResponse } from "next/server";
import { supabaseAuth, supabaseConfigured } from "../../../lib/supabase";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json() as { email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ error: "أدخل البريد الإلكتروني وكلمة المرور" }, { status: 400 });
    if (!supabaseConfigured()) {
      if (email !== "client@dawaa.om" || password !== "Dawaa2026") {
        return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
      }
      const response = NextResponse.json({ ok: true, demo: true });
      response.cookies.set("dawaa_demo", "active", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
      return response;
    }
    const auth = await supabaseAuth("/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
    const data = await auth.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
    if (!auth.ok || !data.access_token) return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("dawaa_access", data.access_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: data.expires_in || 3600 });
    if (data.refresh_token) response.cookies.set("dawaa_refresh", data.refresh_token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الدخول الآن" }, { status: 500 });
  }
}
