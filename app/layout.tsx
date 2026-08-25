import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "تأكيد الحضور | دعوة",
  description: "تأكيد الحضور وإدارة قائمة معازيم المناسبة بسهولة.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
