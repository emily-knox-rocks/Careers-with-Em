import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ModeBanner } from "@/components/ModeBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seeker",
  description: "Agentic job-search platform — the seeker-side mirror of Metaview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 px-3 py-5">
            <div className="mb-6 px-3">
              <span className="text-lg font-semibold tracking-tight text-white">
                Seeker
              </span>
              <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                your job search, with agents
              </p>
            </div>
            <Nav />
          </aside>
          <div className="ml-56 flex min-h-screen flex-1 flex-col">
            <ModeBanner />
            <main className="flex-1 px-8 py-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
