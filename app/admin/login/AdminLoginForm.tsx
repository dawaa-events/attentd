"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password"), scope: "admin" }),
    });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error || "تعذر تسجيل الدخول");
    router.push("/admin/dashboard"); router.refresh();
  }
  return <form onSubmit={submit}>
    <label><span>البريد الإلكتروني</span><input name="email" type="email" required autoComplete="email" /></label>
    <label><span>كلمة المرور</span><input name="password" type="password" required autoComplete="current-password" /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="login-button" disabled={loading}>{loading ? "جاري الدخول..." : "دخول الإدارة"}</button>
  </form>;
}
