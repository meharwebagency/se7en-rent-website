import type { Metadata } from "next";

import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getSiteSettings } from "@/lib/settings/service";
import { siteConfig } from "@/lib/site";
import AboutContent from "@/components/about/about-content";

interface AboutPageProps {
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary();

  return {
    title: dict.about.heroTitle,
    description: dict.about.heroSubtitle,
    alternates: {
      canonical: `/${lang}/about`,
    },
    openGraph: {
      title: dict.about.heroTitle,
      description: dict.about.heroSubtitle,
      type: "website",
    },
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const dict = await getDictionary();
  const settings = await getSiteSettings();
  const mapsUrl = settings?.googleMapsUrl?.trim() || siteConfig.mapsUrl;

  return <AboutContent lang={lang} dict={dict.about} mapsUrl={mapsUrl} />;
}