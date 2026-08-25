import { NextResponse } from "next/server";
import { supabaseConfigured, supabaseRest } from "../../../lib/supabase";

function normalizePhone(input: string) {
  let phone = input.replace(/\D/g, "");
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.length === 8) phone = "968" + phone;
  return phone;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; guestsCount?: number; phone?: string };
    const name = String(body.name || "").trim();
    const guestsCount = Number(body.guestsCount);
    const phone = normalizePhone(String(body.phone || ""));
    if (name.length < 2 || name.length > 80) return NextResponse.json({ error: "يرجى كتابة الاسم الكامل" }, { status: 400 });
    if (!Number.isInteger(guestsCount) || guestsCount < 1 || guestsCount > 10) return NextResponse.json({ error: "يرجى اختيار عدد الحضور" }, { status: 400 });
    if (phone.length < 11 || phone.length > 15) return NextResponse.json({ error: "يرجى التأكد من رقم الهاتف" }, { status: 400 });
    if (!supabaseConfigured()) return NextResponse.json({ ok: true, demo: true }, { status: 201 });

    const res = await supabaseRest("/rest/v1/attendees", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ name, guests_count: guestsCount, phone }),
    });
    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 409 || detail.includes("duplicate")) return NextResponse.json({ error: "تم تأكيد الحضور بهذا الرقم مسبقاً" }, { status: 409 });
      throw new Error(detail);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("ربط") ? error.message : "تعذر حفظ التأكيد الآن، يرجى المحاولة لاحقاً";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
