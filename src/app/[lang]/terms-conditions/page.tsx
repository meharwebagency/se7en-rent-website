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
      ? "الشروط والأحكام | سيڤن لتأجير السيارات والتنقل"
      : "Terms & Conditions | SE7EN Car Rental & Mobility Oman";
  const description =
    lang === "ar"
      ? "اطلع على الشروط والأحكام الخاصة بسيڤن لتأجير السيارات والتنقل في عُمان."
      : "Read the Terms & Conditions for SE7EN Car Rental & Mobility in Oman.";

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
