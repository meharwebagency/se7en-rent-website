import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

import { siteConfig } from "@/lib/site";
import { getSiteSettings } from "@/lib/settings/service";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

interface FooterProps {
  dict: Dictionary;
  lang: Locale;
}

const dayNames: Record<number, { ar: string; en: string }> = {
  0: { ar: "الأحد", en: "Sunday" },
  1: { ar: "الاثنين", en: "Monday" },
  2: { ar: "الثلاثاء", en: "Tuesday" },
  3: { ar: "الأربعاء", en: "Wednesday" },
  4: { ar: "الخميس", en: "Thursday" },
  5: { ar: "الجمعة", en: "Friday" },
  6: { ar: "السبت", en: "Saturday" },
};

export async function Footer({ dict, lang }: FooterProps) {
  const settings = await getSiteSettings();
  const phone = settings?.phone?.trim() || siteConfig.phone;
  const email = settings?.email?.trim() || siteConfig.email;
  const mapsUrl = settings?.googleMapsUrl?.trim() || siteConfig.mapsUrl;
  const addressEn = settings?.addressEn?.trim() || siteConfig.address;
  const addressAr = settings?.addressAr?.trim() || siteConfig.addressAr;

  const social = {
    instagram: settings?.instagramUrl?.trim() || siteConfig.social.instagram,
    tiktok: settings?.tiktokUrl?.trim() || siteConfig.social.tiktok,
    snapchat: settings?.snapchatUrl?.trim() || siteConfig.social.snapchat,
  };

  const waNumber = phone.replace(/\D/g, "");
  const telHref = `tel:${phone.replace(/[\s-]/g, "")}`;
  const waHref = waNumber ? `https://wa.me/${waNumber}` : null;

  const socials = [
    { href: telHref, label: dict.footer.callUs, icon: "/images/icons/footer/phone.png", newTab: false },
    ...(waHref
      ? [{ href: waHref, label: dict.footer.whatsapp, icon: "/images/icons/footer/whatsapp.png", newTab: true }]
      : []),
    { href: social.instagram, label: "Instagram", icon: "/images/icons/footer/instagram.png", newTab: true },
    { href: social.tiktok, label: "TikTok", icon: "/images/icons/footer/tiktok.png", newTab: true },
    { href: social.snapchat, label: "Snapchat", icon: "/images/icons/footer/snapchat.png", newTab: true },
  ];

  return (
    <footer className="border-t border-border bg-black text-zinc-300" id="contact">
      <div className="container-max px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Brand */}
          <div>
            <div className="[&_a]:text-white">
              <Logo lang={lang} />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
              {dict.footer.tagline}
            </p>
            <p className="mt-5 max-w-xs text-sm font-semibold text-zinc-200">
              {dict.footer.fleetTitle}
            </p>
            <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-400">
              {dict.footer.fleetText}
            </p>
            <ul className="mt-3 max-w-xs space-y-1.5 text-sm text-zinc-400">
              <li>{dict.footer.fleetEconomy}</li>
              <li>{dict.footer.fleetFamily}</li>
              <li>{dict.footer.fleetLuxury}</li>
              <li>{dict.footer.fleetSports}</li>
            </ul>
            <div className="mt-5">
              <h3 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider text-white">
                {dict.footer.legal}
              </h3>
              <span className="mb-2 block h-0.5 w-6 rounded-full bg-accent" />
              <ul className="max-w-xs space-y-1.5 text-sm text-zinc-400">
                <li>
                  <Link
                    href={`/${lang}/terms-conditions`}
                    className="transition-colors hover:text-accent"
                  >
                    {dict.footer.terms}
                  </Link>
                </li>
              </ul>
            </div>
            <div className="mt-5 flex items-center gap-3 text-zinc-400">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.newTab === false
                    ? {}
                    : { target: "_blank", rel: "noopener noreferrer" })}
                  aria-label={s.label}
                  className="group flex h-9 w-9 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Image
                    src={s.icon}
                    alt={s.label}
                    width={32}
                    height={32}
                    sizes="32px"
                    className="h-4 w-4 object-contain"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Contact + Hours */}
          <div>
            <div>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-white">
                {dict.footer.contactUs}
              </h3>
              <span className="mb-2 block h-0.5 w-8 rounded-full bg-accent" />
              <ul className="space-y-2.5 text-sm text-zinc-400">
                {phone ? (
                  <li className="inline-flex items-center gap-2">
                    <Image
                      src="/images/icons/footer/phone.png"
                      alt=""
                      width={16}
                      height={16}
                      sizes="16px"
                      className="h-4 w-4 object-contain"
                    />
                    <a
                      href={`tel:${phone.replace(/[\s-]/g, "")}`}
                      dir="ltr"
                      className="transition-colors hover:text-accent"
                    >
                      {phone}
                    </a>
                  </li>
                ) : null}
                <li className="inline-flex items-center gap-2">
                  <Image
                    src="/images/icons/footer/gmail.png"
                    alt=""
                    width={16}
                    height={16}
                    sizes="16px"
                    className="h-4 w-4 object-contain"
                  />
                  <a href={`mailto:${email}`} className="transition-colors hover:text-accent">
                    {email}
                  </a>
                </li>
                <li className="inline-flex items-center gap-2">
                  <Image
                    src="/images/icons/footer/googlemap.png"
                    alt=""
                    width={16}
                    height={16}
                    sizes="16px"
                    className="h-4 w-4 object-contain"
                  />
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent"
                  >
                    {lang === "ar" ? (addressAr || dict.contact.map) : (addressEn || dict.contact.map)}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mt-8 mb-2 font-display text-sm font-semibold uppercase tracking-wider text-white">
                {dict.footer.hours}
              </h3>
              <span className="mb-2 block h-0.5 w-8 rounded-full bg-accent" />
              <ul className="space-y-1.5 text-sm text-zinc-400">
                {Object.entries(siteConfig.hours)
                  .map(([k, v]) => ({ day: Number(k), ...v }))
                  .sort((a, b) => a.day - b.day)
                  .map(({ day, open, close }) => (
                    <li key={day} className="flex items-center justify-between gap-3">
                      <span>{lang === "ar" ? dayNames[day].ar : dayNames[day].en}</span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-accent" />
                        <span dir="ltr">{open} – {close}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={lang} variant="ghost" />
          </div>
          <p className="text-center text-xs text-zinc-500">
            {dict.footer.rights} © {new Date().getFullYear()} {lang === "ar" ? siteConfig.nameAr : siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
