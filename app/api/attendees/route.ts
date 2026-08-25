import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseRest } from "../../../lib/supabase";
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const demoRequested = new URL(request.url).searchParams.get("demo") === "1";
  if (demoRequested || cookieStore.get("dawaa_demo")?.value === "active") {
    const now = Date.now();
    return NextResponse.json([
      { id: "demo-1", name: "مشاعل", guests_count: 1, phone: "96895123456", created_at: new Date(now).toISOString() },
      { id: "demo-2", name: "ثناء", guests_count: 3, phone: "96896123456", created_at: new Date(now - 3600000).toISOString() },
      { id: "demo-3", name: "أضواء", guests_count: 2, phone: "96897123456", created_at: new Date(now - 86400000).toISOString() },
      { id: "demo-4", name: "بريق", guests_count: 4, phone: "96898123456", created_at: new Date(now - 172800000).toISOString() },
    ]);
  }
  const token = cookieStore.get("dawaa_access")?.value;
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const res = await supabaseRest("/rest/v1/attendees?select=id,name,guests_count,phone,created_at&order=created_at.desc", {}, token);
  if (res.status === 401) return NextResponse.json({ error: "انتهت الجلسة" }, { status: 401 });
  if (!res.ok) return NextResponse.json({ error: "تعذر تحميل القائمة" }, { status: 500 });
  return NextResponse.json(await res.json());
}
