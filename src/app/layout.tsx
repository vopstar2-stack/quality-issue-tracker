import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const navItemClass =
  "flex items-center gap-1 rounded px-1 py-0 text-xs leading-5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work Log",
  description: "품질 이슈 등록, 진행상황 관리 및 카카오톡 요약 발송",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 dark:bg-black">
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-start gap-2 px-4 py-0.5">
            <Link href="/" className="text-xs font-bold">
              Work Log
            </Link>
            <nav className="flex flex-wrap items-center justify-start gap-0.5">
              <Link href="/" className={navItemClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <path d="M6 3h9l3 3v15H6z" />
                  <path d="M9 9h6M9 13h6M9 17h4" />
                </svg>
                메모
              </Link>
              <Link href="/issues" className={navItemClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <path d="M9 6h11M9 12h11M9 18h11" />
                  <path d="M4 6h.01M4 12h.01M4 18h.01" />
                </svg>
                이슈 목록
              </Link>
              <Link href="/view/crm" className={navItemClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <rect x="4" y="3" width="16" height="18" rx="1" />
                  <path d="M9 8h1M9 12h1M9 16h6M14 8h1" />
                </svg>
                CRM
              </Link>
              <a
                href="https://raymedi-my.sharepoint.com/:x:/r/personal/wonsoo83_kim_raymedical_com/_layouts/15/doc2.aspx?sourcedoc=%7B12BA563F-74DA-4C57-80D7-2F4BFDD1CBEE%7D&file=Book%208.xlsx&action=editNew&mobileredirect=true&wdOrigin=ONENOTEONLINE.SHELL%2CAPPHOME-WEB.BANNER.NEWBLANK&wdPreviousSession=1d065c56-7183-48cf-b0ce-749b7310a42d&wdPreviousSessionSrc=AppHomeWeb&ct=1773646357773"
                target="_blank"
                rel="noopener noreferrer"
                className={navItemClass}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <rect x="3" y="3" width="18" height="18" rx="1" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
                Book 8
              </a>
              <Link href="/view/dashboard" className={navItemClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l3-4 3 2 4-6" />
                </svg>
                품질검사 대시보드
              </Link>
              {/* 넓은 화면은 왼쪽에 상황판이 늘 떠 있으니 폰·좁은 화면에서만 보이는 링크 */}
              <Link href="/view/mail" className={`${navItemClass} lg:hidden`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
                  <rect x="3" y="5" width="18" height="14" rx="1" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                메일 상황판
              </Link>
            </nav>
          </div>
        </header>
        {/* 넓은 화면(lg 이상): 왼쪽 = 클비서 메일 상황판(고정, 메뉴를 눌러도 그대로), 오른쪽 = 메뉴로 바뀌는 화면 (2026-11-25).
            레이아웃은 페이지를 옮겨도 다시 그려지지 않아서 왼쪽 상황판은 보던 자리 그대로 남는다. */}
        <div className="flex flex-1">
          <aside className="sticky top-[25px] hidden h-[calc(100dvh-25px)] w-1/2 shrink-0 border-r border-neutral-200 lg:block dark:border-neutral-800">
            <iframe title="메일 상황판" src="/mail-dashboard.html" className="block h-full w-full border-0 bg-white" />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
