"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Attendee = { id: string; name: string; guests_count: number; phone: string; created_at: string };
type Card = { id: string; order_number: number; code: string; attendee_id: string | null; reserved_at: string | null; manual_reserved: boolean; note: string | null };

export default function AdminDashboard() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [codesText, setCodesText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [attendeesResponse, cardsResponse] = await Promise.all([fetch("/api/attendees"), fetch("/api/cards")]);
    if (attendeesResponse.status === 401 || cardsResponse.status === 401) return router.replace("/admin/login");
    const [attendeeData, cardData] = await Promise.all([attendeesResponse.json(), cardsResponse.json()]);
    if (Array.isArray(attendeeData)) setAttendees(attendeeData);
    if (Array.isArray(cardData)) setCards(cardData);
  }
  useEffect(() => { load(); }, []);

  async function addCards(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const parsed = codesText.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
      const [order, code] = line.split(/[,،\t;]+/).map(value => value.trim());
      return { order_number: Number(order), code };
    });
    const response = await fetch("/api/cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cards: parsed }) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) return setError(data.error || "تعذر إضافة الأكواد");
    setNotice(`تمت إضافة ${data.length} بطاقة بنجاح`); setCodesText(""); await load();
  }

  async function uploadSheet(event: FormEvent) {
    event.preventDefault();
    if (!sheetFile) return setError("اختاري ملف Excel أولاً");
    setUploading(true); setError(""); setNotice("");
    const body = new FormData(); body.append("file", sheetFile);
    const response = await fetch("/api/cards/import", { method: "POST", body });
    const data = await response.json(); setUploading(false);
    if (!response.ok) return setError(data.error || "تعذر رفع الملف");
    setNotice(`تم استيراد ${data.count} بطاقة من الملف بنجاح`); setSheetFile(null); await load();
  }

  const reserved = cards.filter(card => card.attendee_id || card.manual_reserved);
  const available = cards.filter(card => !card.attendee_id && !card.manual_reserved);
  const attendeeById = useMemo(() => new Map(attendees.map(item => [item.id, item])), [attendees]);
  return <main className="admin-page"><div className="admin-wrap">
    <header className="admin-hero"><div className="admin-brand"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><span>مركز تحكم دعوة</span><h1>لوحة الإدارة</h1><p>رفع الأكواد ومتابعة الحضور والبطاقات من مكان واحد</p></div></div><form action="/api/logout" method="post"><button className="admin-logout">تسجيل الخروج</button></form></header>
    <section className="admin-metrics"><article><small>إجمالي المسجلين</small><strong>{attendees.length}</strong><i>ضيف مسجل</i></article><article><small>البطاقات المتبقية</small><strong>{available.length}</strong><i>جاهزة للحجز</i></article><article><small>البطاقات المحجوزة</small><strong>{reserved.length}</strong><i>تم تخصيصها</i></article><article><small>إجمالي الأكواد</small><strong>{cards.length}</strong><i>في النظام</i></article></section>
    {(error || notice) && <div className="admin-alerts">{error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}</div>}
    <section className="admin-command-grid">
      <form className="admin-upload-card" onSubmit={uploadSheet}><div className="admin-section-title"><span>01</span><div><h2>رفع ملف البطاقات</h2><p>ملف XLSX أو CSV بعمودي رقم الترتيب والكود</p></div></div><label className="sheet-drop"><input type="file" accept=".xlsx,.csv" onChange={event => setSheetFile(event.target.files?.[0] || null)} /><b>{sheetFile ? sheetFile.name : "اختيار ملف Excel"}</b><small>اضغطي هنا لاختيار الملف من جهازك</small></label><button className="admin-primary" disabled={!sheetFile || uploading}>{uploading ? "جاري قراءة الملف..." : "رفع وحفظ البطاقات"}</button></form>
      <section className="admin-recent"><div className="admin-section-title"><span>02</span><div><h2>آخر التسجيلات</h2><p>أحدث بيانات تأكيد الحضور</p></div></div><div className="compact-list">
        {attendees.length === 0 ? <p className="list-empty">لا توجد تسجيلات حتى الآن</p> : attendees.slice(0, 6).map(item => <article key={item.id}><div><strong>{item.name}</strong><small>+{item.phone}</small></div><b>{item.guests_count} حضور</b></article>)}
      </div></section>
    </section>
    <details className="admin-manual"><summary>إضافة الأكواد يدويًا</summary><form className="codes-form" onSubmit={addCards}><textarea value={codesText} onChange={e => setCodesText(e.target.value)} required placeholder={"211, DAWAA-A1B2\n212, DAWAA-C3D4\n213, DAWAA-E5F6"} /><button className="admin-primary" disabled={saving}>{saving ? "جاري الإضافة..." : "إضافة البطاقات"}</button></form></details>
    <section className="admin-cards-panel"><div className="admin-table-heading"><div><span>03</span><h2>سجل البطاقات</h2><p>المحجوز والمتبقي وربط كل بطاقة بالضيف</p></div><b>{available.length} متوفرة</b></div><div className="table-scroll"><table><thead><tr><th>الترتيب</th><th>الكود</th><th>الحالة</th><th>محجوزة لـ</th><th>ملاحظة العميل</th></tr></thead><tbody>
      {cards.length === 0 ? <tr><td colSpan={5} className="empty-state">لم تتم إضافة أكواد بعد</td></tr> : cards.map(card => { const cardReserved = Boolean(card.attendee_id || card.manual_reserved); return <tr key={card.id}><td>{card.order_number}</td><td><strong className="card-code">{card.code}</strong></td><td><span className={cardReserved ? "status reserved" : "status available"}>{cardReserved ? "محجوزة" : "متوفرة"}</span></td><td>{card.attendee_id ? attendeeById.get(card.attendee_id)?.name || "ضيف" : card.manual_reserved ? "حجز يدوي" : "—"}</td><td className="admin-note">{card.note || "—"}</td></tr>; })}
    </tbody></table></div></section>
  </div></main>;
}
