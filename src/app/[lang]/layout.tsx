import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Providers } from "@/components/layout/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { AgentationDev } from "@/components/dev/agentation-provider";
import { ScrollToHash } from "@/components/layout/scroll-to-hash";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

import { getDictionary } from "@/i18n/dictionaries";
import { dirs, isLocale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { fontVariables } from "@/lib/fonts";

import "@/app/globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = await getDictionary();

  return (
    <html
      lang={lang}
      dir={dirs[lang]}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-background font-sans">
        <Providers>
          <Navbar dict={dict} lang={lang} />
          <main className="flex-1">{children}</main>
          <Footer dict={dict} lang={lang} />
          <Toaster />
        </Providers>
        {process.env.NODE_ENV === "development" && <AgentationDev />}
        <ScrollToHash />
        <PageViewTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

export async function generateStaticParams() {
  return [{ lang: "ar" }, { lang: "en" }];
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary();

  return {
    title: {
      default: dict.meta.title,
      template: `%s | ${lang === "ar" ? "الزاجل لتأجير السيارات" : "Al Zajel Rent Car"}`,
    },
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    ),
    icons: {
      icon: [{ url: "/favicon.ico?v=2" }],
      apple: [{ url: "/apple-icon.png?v=2" }],
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      type: "website",
      locale: lang === "ar" ? "ar_OM" : "en_US",
    },
  };
}
