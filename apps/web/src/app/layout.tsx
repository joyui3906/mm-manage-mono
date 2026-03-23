import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "인력 공수 관리",
  description: "프로젝트 및 공수 관리 대시보드",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
