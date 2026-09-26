import type { Metadata } from "next";

import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import TermsContent from "@/components/terms/terms-content";

interface TermsPageProps {
  params: Promise<{ lang: Locale }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary();

  const title =
    lang === "ar"
      ? "الشروط والأحكام | الزاجل لتأجير السيارات"
      : "Terms & Conditions | Al Zajel Rent Car";
  const description =
    lang === "ar"
      ? "اطلع على الشروط والأحكام الخاصة بالزاجل لتأجير السيارات."
      : "Read the Terms & Conditions for Al Zajel Rent Car.";

  return {
    title,
    description,
    alternates: {
      canonical: `/${lang}/terms-conditions`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { lang } = await params;
  const dict = await getDictionary();

  return <TermsContent lang={lang} dict={dict.terms} />;
}
