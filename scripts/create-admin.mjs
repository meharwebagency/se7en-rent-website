#!/usr/bin/env node
/**
 * Provision an admin account (bootstrap).
 *
 * The admin panel has no open sign-up — admins come from the `admins` table
 * tied to an existing Supabase Auth account. Run this once to create the first
 * (super) admin after deploying the schema:
 *
 *   node --env-file=.env.local scripts/create-admin.mjs \
 *     --email admin@example.com --password "a-strong-password" \
 *     [--role super_admin|admin]
 *
 * Defaults role to `super_admin`. Safe to re-run: it won't duplicate rows and
 * reports the existing state instead.
 */
import { createClient } from "@supabase/supabase-js";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function env(key) {
  try {
    return process.env[key];
  } catch {
    return undefined;
  }
}

const email = arg("email");
const password = arg("password");
const role = arg("role", "super_admin");

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs --email <email> --password <password> [--role admin|super_admin]");
  console.error("Run with --env-file=.env.local so SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are available.");
  process.exit(1);
}

if (!["super_admin", "admin"].includes(role)) {
  console.error("--role must be super_admin or admin");
  process.exit(1);
}

const url = env("SUPABASE_URL");
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (listError) throw listError;

const existingUser = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

// The script now wants a deterministic end state: the auth account exists,
  // its password is the one you passed, and the admins row is linked to that
  // exact account id.
  let userId = existingUser?.id ?? null;

  if (!userId) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      console.error("Could not create auth user:", createError.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`Created auth user ${email} (id: ${userId})`);
  } else {
    console.log(`Auth user ${email} already exists (id: ${userId})`);
    // Always force the password + confirmation so the credentials you pass
    // are exactly the credentials you sign in with.
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError && existingUser?.email_confirmed_at == null) {
      console.error("Could not reset password for existing user:", updateError.message);
    } else if (updateError && existingUser?.email_confirmed_at != null) {
      // Password update can still fail if an explicit password hash was set.
      console.warn("Password not reset for already-confirmed user:", updateError.message);
      console.warn("If sign-in fails, reset the password in the Supabase Dashboard first.");
    } else {
      console.log(`Reset password for existing user ${email}`);
    }
  }

const { data: adminRow, error: adminErr } = await supabase
  .from("admins")
  .select("id, role, user_id")
  .eq("user_id", userId)
  .maybeSingle();
if (adminErr) {
  console.error("Could not read admins row:", adminErr.message);
  process.exit(1);
}

if (adminRow) {
  if (adminRow.role === role) {
    console.log(`Already an admin (role: ${role}). Nothing to do.`);
  } else {
    const { error: roleError } = await supabase
      .from("admins")
      .update({ role })
      .eq("id", adminRow.id);
    if (roleError) {
      console.error("Could not update admin role:", roleError.message);
      process.exit(1);
    }
    console.log(`Updated admin role to ${role}.`);
  }
} else {
  const { error: insertError } = await supabase.from("admins").insert({
    user_id: userId,
    role,
  });
  if (insertError) {
    console.error("Could not grant admin role:", insertError.message);
    process.exit(1);
  }
  console.log(`Granted admin role (${role}) to ${email}.`);
}

// Final self-check: prove the auth account and its admin link exist.
const { data: auditUser } = await supabase.auth.admin.getUserById(userId);
const { data: auditAdmin, error: auditAdminErr } = await supabase
  .from("admins")
  .select("id, user_id, role")
  .eq("user_id", userId)
  .maybeSingle();
if (
  auditUser?.user &&
  auditAdmin &&
  auditAdmin.user_id === auditUser.user.id &&
  auditAdmin.role === role
) {
  console.log(
    `Verified: auth user ${auditUser.user.email} (${auditUser.user.id}) is linked to ` +
      `admins row ${auditAdmin.id} with role "${auditAdmin.role}".`,
  );
} else {
  console.error("Self-check FAILED — the admin account and auth user are not correctly linked.");
  if (auditAdminErr) console.error("  admins query error:", auditAdminErr.message);
  process.exit(1);
}

console.log(`Done. ${email} is now an admin (role: ${role}).`);
console.log("Sign in at /admin/login with this email + password.");