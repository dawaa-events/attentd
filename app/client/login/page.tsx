import Link from "next/link";
import LoginForm from "./LoginForm";
export default function LoginPage() {
  return <main className="login-page"><section className="login-card">
    <div className="brand"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><strong>دعوة</strong><small>لخدمات المناسبات</small></div></div>
    <h1>دخول العميل</h1><p>ادخل بيانات حسابك للوصول إلى قائمة الحضور وإرسال البطاقات.</p>
    <LoginForm /><Link className="login-back" href="/">العودة إلى صفحة تأكيد الحضور</Link>
  </section></main>;
}
