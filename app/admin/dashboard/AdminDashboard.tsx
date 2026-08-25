"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Attendee = { id: string; name: string; guests_count: number; phone: string; created_at: string };
type Card = { id: string; order_number: number; code: string; attendee_id: string | null; reserved_at: string | null };

export default function AdminDashboard() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [codesText, setCodesText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  const reserved = cards.filter(card => card.attendee_id);
  const available = cards.filter(card => !card.attendee_id);
  const attendeeById = useMemo(() => new Map(attendees.map(item => [item.id, item])), [attendees]);
  return <main className="client-page"><div className="client-wrap">
    <header className="client-header"><div className="client-logo"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><h1>لوحة إدارة دعوة</h1><p>متابعة الأكواد والعملاء والحضور</p></div></div><form action="/api/logout" method="post"><button className="logout-link">تسجيل الخروج</button></form></header>
    <section className="stats admin-stats"><article className="stat"><small>إجمالي المسجلين</small><strong>{attendees.length}</strong></article><article className="stat"><small>البطاقات المتبقية</small><strong>{available.length}</strong></article><article className="stat"><small>البطاقات المحجوزة</small><strong>{reserved.length}</strong></article><article className="stat"><small>إجمالي الأكواد</small><strong>{cards.length}</strong></article></section>
    <section className="admin-grid">
      <form className="panel codes-form" onSubmit={addCards}><div className="panel-tools"><div><h2>إضافة الأكواد</h2><p>كل سطر: رقم الترتيب، ثم الكود</p></div></div><div className="panel-body">
        <textarea value={codesText} onChange={e => setCodesText(e.target.value)} required placeholder={"211, DAWAA-A1B2\n212, DAWAA-C3D4\n213, DAWAA-E5F6"} />
        {error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}
        <button className="login-button" disabled={saving}>{saving ? "جاري الإضافة..." : "إضافة البطاقات"}</button>
      </div></form>
      <section className="panel"><div className="panel-tools"><div><h2>آخر التسجيلات</h2><p>البيانات الواردة من صفحة تأكيد الحضور</p></div></div><div className="compact-list">
        {attendees.length === 0 ? <p className="list-empty">لا توجد تسجيلات حتى الآن</p> : attendees.slice(0, 6).map(item => <article key={item.id}><div><strong>{item.name}</strong><small>+{item.phone}</small></div><b>{item.guests_count} حضور</b></article>)}
      </div></section>
    </section>
    <section className="panel cards-panel"><div className="panel-tools"><div><h2>متابعة البطاقات</h2><p>المحجوز والمتبقي وربط كل بطاقة بالضيف</p></div><span className="inventory-count">{available.length} متوفرة</span></div><div className="table-scroll"><table><thead><tr><th>الترتيب</th><th>الكود</th><th>الحالة</th><th>محجوزة لـ</th></tr></thead><tbody>
      {cards.length === 0 ? <tr><td colSpan={4} className="empty-state">لم تتم إضافة أكواد بعد</td></tr> : cards.map(card => <tr key={card.id}><td>{card.order_number}</td><td><strong className="card-code">{card.code}</strong></td><td><span className={card.attendee_id ? "status reserved" : "status available"}>{card.attendee_id ? "محجوزة" : "متوفرة"}</span></td><td>{card.attendee_id ? attendeeById.get(card.attendee_id)?.name || "ضيف" : "—"}</td></tr>)}
    </tbody></table></div></section>
  </div></main>;
}
