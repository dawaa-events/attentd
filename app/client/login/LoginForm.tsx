"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginForm() {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(""); const form = new FormData(e.currentTarget);
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const data = await res.json(); setLoading(false);
    if (!res.ok) return setError(data.error || "تعذر تسجيل الدخول");
    router.push("/client/dashboard"); router.refresh();
  }
  return <form onSubmit={submit}>
    <label><span>البريد الإلكتروني</span><input name="email" type="email" required autoComplete="email" placeholder="name@example.com" /></label>
    <label><span>كلمة المرور</span><input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" /></label>
    {error && <p className="form-error">{error}</p>}<button className="login-button" disabled={loading}>{loading ? "جاري الدخول..." : "تسجيل الدخول"}</button>
  </form>;
}
