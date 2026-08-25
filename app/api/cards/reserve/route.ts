import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const token = (await cookies()).get("dawaa_access")?.value;
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { attendeeId, count } = await request.json() as { attendeeId?: string; count?: number };
  if (!attendeeId || !Number.isInteger(count) || Number(count) < 1 || Number(count) > 10) {
    return NextResponse.json({ error: "بيانات الحجز غير صحيحة" }, { status: 400 });
  }
  const response = await supabaseRest("/rest/v1/rpc/reserve_cards", {
    method: "POST",
    body: JSON.stringify({ target_attendee: attendeeId, requested_count: count }),
  }, token);
  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: detail.includes("Not enough") ? "لا توجد بطاقات كافية متوفرة" : "تعذر حجز البطاقة" }, { status: 409 });
  }
  return NextResponse.json(await response.json());
}
