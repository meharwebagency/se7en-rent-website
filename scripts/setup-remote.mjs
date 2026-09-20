/**
 * Applies the SE7EN Car Rental & Mobility backend to a HOSTED Supabase project.
 *
 * Requires (auto-loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       project URL
 *   SUPABASE_ACCESS_TOKEN          Supabase Management API Personal Access Token
 *                                  (https://supabase.com/dashboard/account/tokens)
 *
 * Runs, in order:
 *   1. supabase/migrations/20260101000000_schema.sql   — tables, enums, RLS, functions
 *   2. supabase/migrations/20260101000001_storage.sql   — car-images bucket + policies
 *   3. supabase/migrations/20260101000002_vehicle_features.sql — cars.features jsonb
 *   4. supabase/migrations/20260101000003_admin.sql       — notifications + site settings extras
 *   5. supabase/seed.sql                                — fleet + gallery images
 *
 * Each step is sent to the Management API SQL endpoint as `postgres`.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---- load .env.local --------------------------------------------------------
const env = {};
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) {
  for (const raw of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN in .env.local.\n" +
      "Generate one at https://supabase.com/dashboard/account/tokens and add:\n" +
      "  SUPABASE_ACCESS_TOKEN=sbp_..."
  );
  process.exit(1);
}

const ref = new URL(url).host.split(".")[0];
const API = "https://api.supabase.com";

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function runQuery(label, sql) {
  const res = await fetch(`${API}/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.error(`[${label}] HTTP ${res.status}: ${body.slice(0, 1000)}`);
    return false;
  }
  console.log(`[${label}] OK`);
  return true;
}

console.log(`Project: ${ref}`);

const steps = [
  ["schema", read("supabase/migrations/20260101000000_schema.sql")],
  ["storage", read("supabase/migrations/20260101000001_storage.sql")],
  ["vehicle_features", read("supabase/migrations/20260101000002_vehicle_features.sql")],
  ["admin_extras", read("supabase/migrations/20260101000003_admin.sql")],
  ["seed", read("supabase/seed.sql")],
];

let failed = false;
for (const [label, sql] of steps) {
  if (!sql.trim()) {
    console.error(`[${label}] empty file, skipping`);
    continue;
  }
  if (!(await runQuery(label, sql))) {
    failed = true;
    break;
  }
}

process.exit(failed ? 1 : 0);