import { Cairo, Manrope } from "next/font/google";

/**
 * Fonts are shared between the two root layouts (public `[lang]` and the
 * `/admin` area). Next.js requires `next/font` instances to be created once and
 * referenced from wherever the CSS variables are applied.
 */
export const cairo = Cairo({
  variable: "--font-sans-ar",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const manrope = Manrope({
  variable: "--font-sans-en",
  subsets: ["latin"],
  display: "swap",
});

export const manropeDisplay = Manrope({
  variable: "--font-display-en",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${cairo.variable} ${manrope.variable} ${manropeDisplay.variable}`;