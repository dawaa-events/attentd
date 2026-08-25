import RsvpForm from "./components/RsvpForm";

const event = {
  couple: process.env.EVENT_COUPLE_NAME || "عدنان و مريم",
  date: process.env.EVENT_DATE || "الخميس، 12 نوفمبر 2026",
  time: process.env.EVENT_TIME || "الثامنة مساءً",
  venue: process.env.EVENT_VENUE || "فندق JW ماريوت",
};

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "logo-wrap logo-compact" : "logo-wrap"}>
    <img src="/dawaa-logo.png" alt="شعار دعوة" />
  </div>;
}

export default function Home() {
  return (
    <main className="invitation-page">
      <div className="grain" />
      <div className="royal-orb orb-a" /><div className="royal-orb orb-b" />
      <section className="invitation-shell">
        <aside className="event-panel">
          <header className="dawaa-header"><Logo /><div><span>خدمة دعوة</span><small>لإدارة المعازيم</small></div></header>
          <div className="event-copy">
            <p className="event-kicker">بكل الحب ندعوكم لمشاركتنا حفل زفاف</p>
            <h1>{event.couple}</h1>
            <div className="gold-rule"><i /><b>◆</b><i /></div>
            <p className="event-intro">حضوركم يكمّل فرحتنا ويصنع من هذه الليلة ذكرى أجمل.</p>
          </div>
          <div className="event-facts">
            <article><span className="fact-icon">◷</span><div><small>الوقت</small><strong>{event.time}</strong></div></article>
            <article><span className="fact-icon">◇</span><div><small>التاريخ</small><strong>{event.date}</strong></div></article>
            <article><span className="fact-icon">⌖</span><div><small>الموقع</small><strong>{event.venue}</strong></div></article>
          </div>
          <p className="event-note">يرجى تأكيد الحضور للحصول على بطاقة الدخول الخاصة بكم</p>
        </aside>

        <section className="form-panel">
          <div className="mobile-logo"><Logo compact /><div><span>خدمة دعوة</span><small>لإدارة المعازيم</small></div></div>
          <div className="form-panel-heading">
            <span className="step-pill">تأكيد الحضور</span>
            <h2>ننتظر حضوركم بكل ود</h2>
            <p>يرجى تعبئة البيانات التالية بدقة لإصدار بطاقة الدخول.</p>
          </div>
          <RsvpForm />
          <footer><span>بياناتكم محفوظة وآمنة</span><nav><a href="/client/login">دخول العميل</a><a href="/admin/login">دخول الإدارة</a></nav></footer>
        </section>
      </section>
      <footer className="dawaa-contact" aria-label="بيانات التواصل مع دعوة">
        <span>للتواصل مع دعوة</span>
        <a href="https://www.instagram.com/dawaa.events" target="_blank" rel="noreferrer" aria-label="إنستغرام دعوة">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.25" /><circle cx="17.4" cy="6.7" r="1" className="icon-fill" /></svg>
          <b dir="ltr">@dawaa.events</b>
        </a>
        <i aria-hidden="true" />
        <a href="https://wa.me/96871136500" target="_blank" rel="noreferrer" aria-label="واتساب دعوة">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2a8.5 8.5 0 1 1 15.6-4.6Z" /><path d="M8.1 7.8c.2-.4.4-.4.8-.4h.5c.2 0 .4.1.5.4l.8 2c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.7 1.3 1.8 2.3 3.2 2.9.2.1.4.1.6-.1l.9-1.1c.2-.2.4-.3.7-.2l2 .9c.3.1.4.3.4.5 0 .4-.2 1.5-1 2.1-.7.6-1.7.9-2.8.6-1.2-.3-2.7-.8-4.4-2.3-1.4-1.3-2.4-2.8-2.7-4-.4-1.2 0-2.6.4-3.1l.9-.3Z" /></svg>
          <b dir="ltr">+968 7113 6500</b>
        </a>
      </footer>
    </main>
  );
}
