"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader({ name, email }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-ink/10 bg-white/90 p-6 shadow-[0_30px_70px_-50px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/40">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          Welcome back, {name || "Marketer"}
        </h1>
        <p className="mt-2 text-sm text-ink/60">Signed in as {email}</p>
      </div>
      <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
