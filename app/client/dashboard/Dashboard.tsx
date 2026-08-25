"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Attendee = { id: string; name: string; guests_count: number; phone: string; created_at: string };
type Card = { id: string; order_number: number; code: string; attendee_id: string | null; reserved_at: string | null };

export default function Dashboard() {
  const router = useRouter();
  const [rows, setRows] = useState<Attendee[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const instructions = process.env.NEXT_PUBLIC_CARD_MESSAGE || "مرحباً، نرسل لكم بطاقة الدخول الخاصة بالمناسبة. يرجى الاحتفاظ بها وإبرازها عند الدخول.";

  async function load() {
    const [attendeesResponse, cardsResponse] = await Promise.all([fetch("/api/attendees"), fetch("/api/cards")]);
    if (attendeesResponse.status === 401 || cardsResponse.status === 401) return router.replace("/client/login");
    const [attendeeData, cardData] = await Promise.all([attendeesResponse.json(), cardsResponse.json()]);
    if (Array.isArray(attendeeData)) setRows(attendeeData);
    if (Array.isArray(cardData)) setCards(cardData);
    setLoading(false);
  }
  useEffect(() => { load(); }, [router]);

  const filtered = useMemo(() => rows.filter(row => row.name.includes(query) || row.phone.includes(query)), [rows, query]);
  const totalGuests = rows.reduce((sum, row) => sum + row.guests_count, 0);
  const available = cards.filter(card => !card.attendee_id);
  const reserved = cards.filter(card => card.attendee_id);

  async function reserveAndSend(row: Attendee) {
    const popup = window.open("about:blank", "_blank");
    setSendingId(row.id);
    try {
      const response = await fetch("/api/cards/reserve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId: row.id, count: row.guests_count }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حجز البطاقة");
      const assigned = data as Card[];
      setCards(current => {
        const assignedById = new Map(assigned.map(card => [card.id, card]));
        return current.map(card => assignedById.get(card.id) || card);
      });
      const codes = assigned.map(card => `• ${card.order_number} - ${card.code}`).join("\n");
      const message = `الفاضلة/ ${row.name}\n\n${instructions}\n\nبطاقات الدخول المخصصة لكم:\n${codes}`;
      const link = `https://api.whatsapp.com/send?phone=${row.phone}&text=${encodeURIComponent(message)}`;
      if (popup) popup.location.href = link; else window.location.href = link;
    } catch (error) {
      if (popup) popup.close();
      alert(error instanceof Error ? error.message : "تعذر إرسال البطاقة");
    } finally { setSendingId(null); }
  }

  return <main className="client-page"><div className="client-wrap">
    <header className="client-header"><div className="client-logo"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><h1>صفحة العميل</h1><p>إدارة الحضور وبطاقات الدخول</p></div></div><form action="/api/logout" method="post"><button className="logout-link">تسجيل الخروج</button></form></header>
    <section className="stats"><article className="stat"><small>عدد الراغبين بالحضور</small><strong>{totalGuests}</strong></article><article className="stat"><small>البطاقات المتوفرة</small><strong>{available.length}</strong></article><article className="stat"><small>البطاقات المحجوزة</small><strong>{reserved.length}</strong></article></section>
    <section className="panel"><div className="panel-tools"><h2>قائمة المؤكدين</h2><input className="search-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث بالاسم أو الرقم..." /></div>
      <div className="table-scroll"><table><thead><tr><th>#</th><th>الاسم</th><th>عدد الحضور</th><th>رقم الهاتف</th><th>وقت التسجيل</th><th>الإجراء</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="empty-state">جاري تحميل القائمة...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="empty-state">لا توجد تسجيلات حتى الآن</td></tr> : filtered.map((row, index) => {
          const hasCards = cards.some(card => card.attendee_id === row.id);
          return <tr key={row.id}><td className="row-number">{index + 1}</td><td><strong>{row.name}</strong></td><td>{row.guests_count}</td><td><a className="phone-link" href={`tel:+${row.phone}`}>+{row.phone}</a></td><td>{new Date(row.created_at).toLocaleString("ar-OM", { dateStyle: "short", timeStyle: "short" })}</td><td><button className="send-card" onClick={() => reserveAndSend(row)} disabled={sendingId === row.id}>{sendingId === row.id ? "جاري الحجز..." : hasCards ? "إرسال البطاقة ↖" : "حجز وإرسال ↖"}</button></td></tr>;
        })}
      </tbody></table></div>
    </section>
    <section className="panel cards-panel"><div className="panel-tools"><div><h2>قائمة بطاقات الدخول</h2><p>تحديث مباشر لحالة البطاقات المحجوزة والمتوفرة</p></div><span className="inventory-count">{available.length} متوفرة</span></div>
      <div className="table-scroll"><table><thead><tr><th>رقم الترتيب</th><th>الكود</th><th>الحالة</th></tr></thead><tbody>
        {cards.length === 0 ? <tr><td colSpan={3} className="empty-state">لم تضف الإدارة بطاقات حتى الآن</td></tr> : cards.map(card => <tr key={card.id}><td>{card.order_number}</td><td><strong className="card-code">{card.code}</strong></td><td><span className={card.attendee_id ? "status reserved" : "status available"}>{card.attendee_id ? "محجوزة" : "متوفرة"}</span></td></tr>)}
      </tbody></table></div>
    </section>
  </div></main>;
}
