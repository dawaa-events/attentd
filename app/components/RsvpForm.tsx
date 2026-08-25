"use client";
import { FormEvent, useState } from "react";

export default function RsvpForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("sending"); setError("");
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    try {
      const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: form.get("name"), guestsCount: Number(form.get("guestsCount")), phone: form.get("phone"),
      })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر حفظ التأكيد");
      formElement.reset(); setStatus("done");
    } catch (err) { setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع"); setStatus("error"); }
  }
  if (status === "done") return (
    <section className="success-card" aria-live="polite"><div className="success-rings"><div className="success-icon">✓</div></div>
      <span className="success-label">اكتمل التأكيد بنجاح</span>
      <h2>شكراً لك، تم تأكيد الحضور</h2><p>يسعدنا حضوركم. سيتم إرسال بطاقة الدخول عبر الواتساب قريباً.</p>
      <button type="button" className="text-button" onClick={() => setStatus("idle")}>تسجيل شخص آخر</button>
    </section>
  );
  return (
    <form className="rsvp-card" onSubmit={submit}>
      <label><span>الاسم الكامل <em>*</em></span><input name="name" type="text" required minLength={2} maxLength={80} placeholder="اكتب الاسم كما سيظهر في القائمة" autoComplete="name" /></label>
      <label><span>عدد الراغبين بالحضور <em>*</em></span><select name="guestsCount" required defaultValue=""><option value="" disabled>اختر عدد الحضور</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
      <label><span>رقم الهاتف <em>*</em></span><div className="phone-field"><input name="phone" type="tel" required inputMode="numeric" minLength={8} maxLength={16} placeholder="مثال: 99887766" autoComplete="tel" /><em>+968</em></div></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="confirm-button" type="submit" disabled={status === "sending"}><span>{status === "sending" ? "جاري التأكيد..." : "تأكيد الحضور"}</span><b>←</b></button>
    </form>
  );
}
