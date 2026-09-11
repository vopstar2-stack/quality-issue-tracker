import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
        <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-4">
            <Link href="/" className="text-lg font-bold">
              Work Log
            </Link>
            <Link
              href="/"
              aria-label="홈"
              title="홈"
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
              </svg>
            </Link>
            <Link
              href="/tank-replacements"
              aria-label="Tank 누유대체"
              title="Tank 누유대체"
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 3v6" />
                <path d="M8 9h8l1.5 4.5a4.5 4.5 0 0 1-1 4.9l-.5.5a4 4 0 0 1-2.8 1.1h-2.4a4 4 0 0 1-2.8-1.1l-.5-.5a4.5 4.5 0 0 1-1-4.9L8 9Z" />
              </svg>
            </Link>
            <a
              href="https://ray-service-crm.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CRM"
              title="CRM"
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <rect x="4" y="3" width="16" height="18" rx="1" />
                <path d="M9 8h1M9 12h1M9 16h6M14 8h1" />
              </svg>
            </a>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
