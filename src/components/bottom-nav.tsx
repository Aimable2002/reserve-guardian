import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Vault,
  BarChart3,
  History,
  HandCoins,
  Wallet,
  MoreHorizontal,
  FileBarChart2,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

const primary = [
  { to: "/", label: "Vault", Icon: Vault },
  { to: "/wallet", label: "Wallet", Icon: Wallet },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/history", label: "History", Icon: History },
] as const;

const moreItems = [
  { to: "/reports", label: "Financial reports", desc: "Ledger, statements, bundled report", Icon: FileBarChart2 },
  { to: "/lending", label: "P2P Lending", desc: "Borrow against your vault — coming soon", Icon: HandCoins },
  { to: "/approvals", label: "Withdrawal approvals", desc: "Review requests on shared reserves", Icon: ShieldCheck },
  { to: "/account", label: "Account", desc: "Profile, currency, password", Icon: User },
] as const;

const moreRoutes = moreItems.map((i) => i.to);

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();

  const moreActive = moreRoutes.some((r) => pathname.startsWith(r));

  return (
    <>
      <nav
        className="fixed inset-x-3 bottom-4 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl border border-reserve-navy/5 bg-white/85 px-1 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-reserve-navy/85"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        {primary.map(({ to, label, Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition active:scale-95 ${
                active ? "text-reserve-navy dark:text-white" : "text-reserve-slate opacity-60"
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          aria-label="More"
          onClick={() => setOpen(true)}
          className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition active:scale-95 ${
            moreActive ? "text-reserve-navy dark:text-white" : "text-reserve-slate opacity-60"
          }`}
        >
          <MoreHorizontal className="size-5" strokeWidth={moreActive ? 2.25 : 1.75} />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-reserve-navy/10 pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">More</SheetTitle>
            <SheetDescription className="text-xs">Everything outside the main tabs.</SheetDescription>
          </SheetHeader>
          <div className="mt-2 flex flex-col gap-1 px-4">
            {moreItems.map(({ to, label, desc, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 transition active:scale-[0.99] active:bg-reserve-navy/5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-reserve-navy/5 text-reserve-navy dark:bg-white/10 dark:text-white">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block truncate text-[11px] text-reserve-slate">{desc}</span>
                </span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-destructive transition active:scale-[0.99] active:bg-destructive/5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="size-4" />
              </span>
              <span className="text-sm font-semibold">Sign out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
