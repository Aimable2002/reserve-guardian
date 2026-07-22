import { Link, useRouterState } from "@tanstack/react-router";
import { Vault, BarChart3, History, HandCoins } from "lucide-react";

const items = [
  { to: "/", label: "Vault", Icon: Vault },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/history", label: "History", Icon: History },
  { to: "/lending", label: "Lending", Icon: HandCoins },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex h-16 max-w-md items-center justify-around rounded-2xl border border-reserve-navy/5 bg-white/85 px-2 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-reserve-navy/85"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      {items.map(({ to, label, Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-1 transition ${
              active ? "text-reserve-navy dark:text-white" : "text-reserve-slate opacity-60"
            }`}
          >
            <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}