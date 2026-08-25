import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseRest } from "../../../lib/supabase";
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dawaa_access")?.value;
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const res = await supabaseRest("/rest/v1/attendees?select=id,name,guests_count,phone,created_at&order=created_at.desc", {}, token);
  if (res.status === 401) return NextResponse.json({ error: "انتهت الجلسة" }, { status: 401 });
  if (!res.ok) return NextResponse.json({ error: "تعذر تحميل القائمة" }, { status: 500 });
  return NextResponse.json(await res.json());
}
