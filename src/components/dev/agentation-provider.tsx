"use client";

import dynamic from "next/dynamic";

// Lazy-load the Agentation toolbar only in development. The guard below is
// evaluated at build time in production, so the lazy chunk is never emitted.
const Agentation = dynamic(
  () => import("agentation").then((m) => m.Agentation),
  { ssr: false }
);

export function AgentationDev() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation />;
}