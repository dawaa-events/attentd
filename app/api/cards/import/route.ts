import { inflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseUser, supabaseRest } from "../../../../lib/supabase";

type CardInput = { order_number: number; code: string };

function decodeXml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function unzipEntries(buffer: Buffer) {
  let eocd = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 65557); index--) {
    if (buffer.readUInt32LE(index) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error("ملف Excel غير صالح");
  const entries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let index = 0; index < entries; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("تعذر قراءة ملف Excel");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) files.set(name, compressed);
    else if (method === 8) files.set(name, inflateRawSync(compressed));
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return files;
}

function parseXlsx(buffer: Buffer) {
  const files = unzipEntries(buffer);
  const sharedXml = files.get("xl/sharedStrings.xml")?.toString("utf8") || "";
  const shared = [...sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(match =>
    decodeXml([...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(item => item[1]).join(""))
  );
  const sheet = files.get("xl/worksheets/sheet1.xml")?.toString("utf8");
  if (!sheet) throw new Error("لم يتم العثور على الورقة الأولى");
  return [...sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const row: string[] = [];
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1] || "A";
      let column = 0;
      for (const char of ref) column = column * 26 + char.charCodeAt(0) - 64;
      const type = cell[1].match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? cell[2].match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? "";
      row[column - 1] = type === "s" ? (shared[Number(raw)] || "") : decodeXml(raw);
    }
    return row;
  }).filter(row => row.some(value => String(value || "").trim()));
}

function parseCsv(text: string) {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean).map(line => {
    const cells: string[] = []; let value = ""; let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if ((char === "," || char === ";" || char === "\t") && !quoted) { cells.push(value.trim()); value = ""; }
      else value += char;
    }
    cells.push(value.trim()); return cells;
  });
}

function toCards(rows: string[][]): CardInput[] {
  if (rows.length < 2) throw new Error("الملف فارغ أو لا يحتوي على بيانات");
  const headers = rows[0].map(value => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, ""));
  let orderIndex = headers.findIndex(value => ["رقمالترتيب", "الترتيب", "order", "ordernumber"].includes(value));
  let codeIndex = headers.findIndex(value => ["الكود", "كود", "code", "cardcode"].includes(value));
  if (orderIndex < 0 || codeIndex < 0) { orderIndex = 0; codeIndex = 1; }
  const cards = rows.slice(1).map(row => ({
    order_number: Number(String(row[orderIndex] || "").trim()),
    code: String(row[codeIndex] || "").trim().toUpperCase(),
  })).filter(card => card.order_number || card.code);
  if (!cards.length) throw new Error("لم يتم العثور على بطاقات في الملف");
  if (cards.length > 2000) throw new Error("الحد الأعلى 2000 بطاقة في الملف الواحد");
  if (cards.some(card => !Number.isInteger(card.order_number) || card.order_number < 1 || !/^DAWAA-[A-Z0-9-]+$/.test(card.code))) {
    throw new Error("تأكد من أن الملف يحتوي على رقم ترتيب صحيح وكود بصيغة DAWAA-XXXX");
  }
  return cards;
}

export async function POST(request: Request) {
  const token = (await cookies()).get("dawaa_access")?.value;
  if (!token) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const user = await getSupabaseUser(token);
  if (!user || user.email?.toLowerCase() !== (process.env.ADMIN_EMAIL || "").toLowerCase()) {
    return NextResponse.json({ error: "هذه العملية للإدارة فقط" }, { status: 403 });
  }
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "اختر ملف Excel" }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "حجم الملف أكبر من 8MB" }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const lowerName = file.name.toLowerCase();
    const rows = lowerName.endsWith(".xlsx") ? parseXlsx(bytes) : lowerName.endsWith(".csv") ? parseCsv(bytes.toString("utf8")) : null;
    if (!rows) return NextResponse.json({ error: "الصيغ المدعومة هي XLSX وCSV" }, { status: 400 });
    const cards = toCards(rows);
    const response = await supabaseRest("/rest/v1/cards", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(cards),
    }, token);
    if (!response.ok) {
      const detail = await response.text();
      const duplicate = detail.includes("duplicate") || response.status === 409;
      return NextResponse.json({ error: duplicate ? "يوجد رقم ترتيب أو كود مكرر" : "تعذر حفظ البطاقات" }, { status: duplicate ? 409 : 500 });
    }
    const inserted = await response.json();
    return NextResponse.json({ count: inserted.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر قراءة الملف" }, { status: 400 });
  }
}
