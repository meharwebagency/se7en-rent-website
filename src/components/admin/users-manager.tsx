"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  adminGrantAccess,
  adminRevokeAccess,
  adminSetAdminRole,
} from "@/app/actions/admin";

import { formatAdminDate } from "@/lib/admin/format";
import type { AdminUser } from "@/lib/admin/queries";
import type { Database } from "@/lib/supabase/database.types";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type AdminRole = Database["public"]["Enums"]["admin_role"];

interface UsersManagerProps {
  users: AdminUser[];
  dict: Dictionary["admin"];
  locale: Locale;
  currentUserId: string;
}

export function UsersManager({ users, dict, locale, currentUserId }: UsersManagerProps) {
  const router = useRouter();
  const [grantOpen, setGrantOpen] = React.useState(false);
  const [grantEmail, setGrantEmail] = React.useState("");
  const [grantRole, setGrantRole] = React.useState<AdminRole>("admin");
  const [busy, setBusy] = React.useState(false);
  const [target, setTarget] = React.useState<AdminUser | null>(null);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await adminGrantAccess(grantEmail, grantRole);
    setBusy(false);
    if (result.ok) {
      toast.success(result.message ?? dict.users.grantedMsg);
      setGrantOpen(false);
      setGrantEmail("");
      setGrantRole("admin");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleRoleChange(user: AdminUser, role: AdminRole) {
    const result = await adminSetAdminRole(user.id, role);
    if (result.ok) {
      toast.success(dict.common.save);
      router.refresh();
    } else {
      toast.error(result.error);
      router.refresh();
    }
  }

  async function handleRevoke() {
    if (!target) return;
    setBusy(true);
    const result = await adminRevokeAccess(target.id);
    setBusy(false);
    setTarget(null);
    if (result.ok) {
      toast.success(dict.users.revokedMsg);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setGrantOpen(true)}>
        <Plus className="h-4 w-4" />
        {dict.users.add}
      </Button>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {dict.users.noResults}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{dict.users.email}</th>
                  <th className="px-3 py-3 text-start font-medium">{dict.users.role}</th>
                  <th className="hidden px-3 py-3 text-start font-medium md:table-cell">{dict.users.granted}</th>
                  <th className="px-4 py-3 text-end font-medium">{dict.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const isSelf = user.userId === currentUserId;
                  return (
                    <tr key={user.id} className="transition-colors hover:bg-secondary/50">
                      <td className="px-4 py-3">
                        <span dir="ltr" className="font-medium">{user.email}</span>
                        {isSelf ? (
                          <Badge variant="accent" className="ms-2">({dict.users.you})</Badge>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="sm:w-44">
                          <Select
                            value={user.role}
                            onValueChange={(v) => void handleRoleChange(user, v as AdminRole)}
                            disabled={isSelf}
                          >
                            <SelectTrigger aria-label={dict.users.role}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{dict.users.roleAdmin}</SelectItem>
                              <SelectItem value="super_admin">{dict.users.roleSuper}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="hidden px-3 py-3 text-xs text-muted-foreground md:table-cell">
                        {formatAdminDate(user.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                className="text-destructive hover:text-destructive"
                                title={dict.table.delete}
                                disabled={isSelf}
                                onClick={() => setTarget(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{dict.users.revokeTitle}</DialogTitle>
                                <DialogDescription>{dict.users.revokeConfirm}</DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setTarget(null)}>
                                  {dict.common.cancel}
                                </Button>
                                <Button variant="destructive" onClick={() => void handleRevoke()} disabled={isSelf || busy}>
                                  <Trash2 className="h-4 w-4" />
                                  {dict.common.confirm}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogTrigger asChild>
          <span className="hidden" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.users.grantTitle}</DialogTitle>
            <DialogDescription>{dict.users.grantHelp}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGrant} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="grant-email">{dict.users.email}</Label>
              <Input
                id="grant-email"
                type="email"
                dir="ltr"
                required
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{dict.users.role}</Label>
              <Select value={grantRole} onValueChange={(v) => setGrantRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{dict.users.roleAdmin}</SelectItem>
                  <SelectItem value="super_admin">{dict.users.roleSuper}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {dict.users.add}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}