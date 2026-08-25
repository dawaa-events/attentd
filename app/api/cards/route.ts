import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseUser, supabaseRest } from "../../../lib/supabase";

async function session() {
  const token = (await cookies()).get("dawaa_access")?.value;
  if (!token) return null;
  const user = await getSupabaseUser(token);
  return user ? { token, user } : null;
}

export async function GET() {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const response = await supabaseRest("/rest/v1/cards?select=id,order_number,code,attendee_id,reserved_at,created_at&order=order_number.asc", {}, auth.token);
  if (!response.ok) return NextResponse.json({ error: "تعذر تحميل البطاقات" }, { status: 500 });
  return NextResponse.json(await response.json());
}

export async function POST(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (auth.user.email?.toLowerCase() !== (process.env.ADMIN_EMAIL || "").toLowerCase()) {
    return NextResponse.json({ error: "هذه العملية للإدارة فقط" }, { status: 403 });
  }
  const { cards } = await request.json() as { cards?: Array<{ order_number: number; code: string }> };
  if (!Array.isArray(cards) || cards.length === 0 || cards.length > 1000) {
    return NextResponse.json({ error: "أضف بطاقة واحدة على الأقل" }, { status: 400 });
  }
  const cleaned = cards.map(card => ({
    order_number: Number(card.order_number),
    code: String(card.code || "").trim().toUpperCase(),
  }));
  if (cleaned.some(card => !Number.isInteger(card.order_number) || card.order_number < 1 || !/^DAWAA-[A-Z0-9-]+$/.test(card.code))) {
    return NextResponse.json({ error: "تأكد من أرقام الترتيب والأكواد بصيغة DAWAA-XXXX" }, { status: 400 });
  }
  const response = await supabaseRest("/rest/v1/cards", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(cleaned),
  }, auth.token);
  if (!response.ok) {
    const detail = await response.text();
    const duplicate = detail.includes("duplicate") || response.status === 409;
    return NextResponse.json({ error: duplicate ? "يوجد رقم ترتيب أو كود مكرر" : "تعذر إضافة الأكواد" }, { status: duplicate ? 409 : 500 });
  }
  return NextResponse.json(await response.json(), { status: 201 });
}
