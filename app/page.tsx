import RsvpForm from "./components/RsvpForm";

const event = {
  couple: process.env.EVENT_COUPLE_NAME || "حفل زفاف مريم و ...",
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
            <p className="event-kicker">بكل الحب، ندعوكم لمشاركتنا</p>
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
            <h2>ننتظر حضوركم بكل شوق</h2>
            <p>يرجى تعبئة البيانات التالية بدقة لإصدار بطاقة الدخول.</p>
          </div>
          <RsvpForm />
          <footer><span>بياناتكم محفوظة وآمنة</span><nav><a href="/client/login">دخول العميل</a><a href="/admin/login">دخول الإدارة</a></nav></footer>
        </section>
      </section>
    </main>
  );
}
