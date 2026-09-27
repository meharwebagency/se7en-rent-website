import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";

import { Providers } from "@/components/layout/providers";
import { Toaster } from "@/components/ui/toaster";
import { AgentationDev } from "@/components/dev/agentation-provider";

import { getAdminLocale } from "@/lib/admin/i18n";
import { dirs } from "@/i18n/config";
import { fontVariables } from "@/lib/fonts";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Al Zajel Admin",
    template: "%s | Al Zajel Admin",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

/**
 * Second root layout for the `/admin` area (Next.js multiple root layouts).
 * Crossing from `/ar/...` into `/admin` triggers a full page load, which is
 * exactly what an independent, appliance-like admin UI wants.
 */
export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getAdminLocale();

  return (
    <html
      lang={locale}
      dir={dirs[locale]}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans">
        <Providers>
          {children}
          <Toaster />
        </Providers>
        {process.env.NODE_ENV === "development" && <AgentationDev />}
        <Analytics />
      </body>
    </html>
  );
}