"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Attendee = { id: string; name: string; guests_count: number; phone: string; created_at: string };
export default function Dashboard() {
  const router = useRouter(); const [rows, setRows] = useState<Attendee[]>([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo") === "1";
    fetch(demo ? "/api/attendees?demo=1" : "/api/attendees").then(async r => {
      if (r.status === 401) { router.replace("/client/login"); return []; }
      return r.json();
    }).then(data => { if (Array.isArray(data)) setRows(data); setLoading(false); }).catch(() => setLoading(false));
  }, [router]);
  const filtered = useMemo(() => rows.filter(r => r.name.includes(query) || r.phone.includes(query)), [rows, query]);
  const totalGuests = rows.reduce((sum, r) => sum + r.guests_count, 0);
  const cards = [
    { order: 1, code: "DAWAA-0001", status: "محجوزة" },
    { order: 2, code: "DAWAA-0002", status: "متوفرة" },
    { order: 3, code: "DAWAA-0003", status: "متوفرة" },
    { order: 4, code: "DAWAA-0004", status: "متوفرة" },
  ];
  const instructions = process.env.NEXT_PUBLIC_CARD_MESSAGE || "مرحباً، نرسل لكم بطاقة الدخول الخاصة بالمناسبة. يرجى الاحتفاظ بها وإبرازها عند الدخول.";
  function whatsapp(row: Attendee) { return `https://wa.me/${row.phone}?text=${encodeURIComponent(`الفاضلة/ ${row.name}\n\n${instructions}`)}`; }
  return <main className="client-page"><div className="client-wrap">
    <header className="client-header"><div className="client-logo"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><h1>صفحة العميل</h1><p>إدارة الحضور وبطاقات الدخول</p></div></div><form action="/api/logout" method="post"><button className="logout-link">تسجيل الخروج</button></form></header>
    <section className="stats"><article className="stat"><small>عدد الراغبين بالحضور</small><strong>{totalGuests}</strong></article><article className="stat"><small>البطاقات المتوفرة</small><strong>300</strong></article><article className="stat"><small>البطاقات المحجوزة</small><strong>200</strong></article></section>
    <section className="panel"><div className="panel-tools"><h2>قائمة المؤكدين</h2><input className="search-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو الرقم..." /></div>
      <div className="table-scroll"><table><thead><tr><th>#</th><th>الاسم</th><th>عدد الحضور</th><th>رقم الهاتف</th><th>وقت التسجيل</th><th>الإجراء</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={6} className="empty-state">جاري تحميل القائمة...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="empty-state">لا توجد تسجيلات حتى الآن</td></tr> : filtered.map((row, index) => <tr key={row.id}><td className="row-number">{index + 1}</td><td><strong>{row.name}</strong></td><td>{row.guests_count}</td><td><a className="phone-link" href={`tel:+${row.phone}`}>+{row.phone}</a></td><td>{new Date(row.created_at).toLocaleString("ar-OM", { dateStyle: "short", timeStyle: "short" })}</td><td><a className="send-card" href={whatsapp(row)} target="_blank" rel="noreferrer">إرسال البطاقة <span>↖</span></a></td></tr>)}
      </tbody></table></div>
    </section>
    <section className="panel cards-panel"><div className="panel-tools"><div><h2>قائمة بطاقات الدخول</h2><p>تحديث مباشر لحالة البطاقات المستخدمة والمتوفرة</p></div><span className="inventory-count">{cards.filter(c => c.status === "متوفرة").length} متوفرة</span></div>
      <div className="table-scroll"><table><thead><tr><th>رقم الترتيب</th><th>الكود</th><th>الحالة</th></tr></thead><tbody>
        {cards.map(card => <tr key={card.code}><td>{card.order}</td><td><strong className="card-code">{card.code}</strong></td><td><span className={card.status === "متوفرة" ? "status available" : "status reserved"}>{card.status === "متوفرة" ? "✓" : "•"} {card.status}</span></td></tr>)}
      </tbody></table></div>
    </section>
  </div></main>;
}
