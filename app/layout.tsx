import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Chennai Unsaid",
  description:
    "What brokers, landlords and listings never tell you about a Chennai area: whether it floods, how hot it runs, and what residents go through every monsoon.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Link href="/" className="font-semibold text-teal-800">
              Chennai Unsaid
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4">{children}</main>
        <footer className="mx-auto w-full max-w-3xl px-4 py-6 text-center text-sm text-slate-500">
          Built on AWS for the Bharat Builds Tour.
        </footer>
      </body>
    </html>
  );
}
