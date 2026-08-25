import Link from "next/link";
import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return <main className="login-page"><section className="login-card">
    <div className="brand"><div className="logo-wrap logo-compact"><img src="/dawaa-logo.png" alt="شعار دعوة" /></div><div><strong>دعوة</strong><small>لوحة الإدارة</small></div></div>
    <h1>دخول الإدارة</h1>
    <p>هذه الصفحة مخصصة لإدارة الأكواد ومتابعة العملاء والحضور.</p>
    <AdminLoginForm />
    <Link className="login-back" href="/">العودة إلى صفحة تأكيد الحضور</Link>
  </section></main>;
}
