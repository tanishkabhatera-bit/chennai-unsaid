import type { Metadata } from "next";
import Link from "next/link";
import { Bungee, Permanent_Marker, Rubik } from "next/font/google";
import { Suspense } from "react";
import SiteMenu from "@/components/SiteMenu";
import "./globals.css";

const bungee = Bungee({ variable: "--font-bungee", weight: "400", subsets: ["latin"] });
const rubik = Rubik({ variable: "--font-rubik", subsets: ["latin"] });
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chennai Unsaid",
  description:
    "A place can look perfect. Until it rains. Flood history, heat and water for any Chennai area, before you rent or buy, with every flood mark linked to its source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bungee.variable} ${rubik.variable} ${marker.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-body">
        <header className="border-b-[4px] border-ink">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="block" aria-label="Chennai Unsaid, home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/signboard.png" alt="Chennai Unsaid" className="h-10 w-auto sm:h-12" />
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden font-marker text-rust sm:inline">the things listings leave out</span>
              {/* SiteMenu reads the URL, so it renders at request time inside Suspense. */}
              <Suspense fallback={<span className="h-11 w-11 rounded-xl border-[3px] border-ink bg-chalk" aria-hidden="true" />}>
                <SiteMenu />
              </Suspense>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
        <footer className="mx-auto w-full max-w-5xl px-4 py-8 font-body text-sm text-ink/70">
          Built on AWS for the Bharat Builds Tour. Flood marks come from news reports; heat ratings are indicative.
        </footer>
      </body>
    </html>
  );
}
