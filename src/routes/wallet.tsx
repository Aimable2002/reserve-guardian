import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout route for everything under /wallet. This file's only job is to
 * render the matched child route via <Outlet />. The actual Wallet home
 * page lives in wallet.index.tsx, and each action (deposit, withdraw, send,
 * receive, move-in, move-out) has its own file — all of them render here.
 *
 * Do NOT put page content directly in this component: because wallet.tsx
 * is the parent for every wallet.*.tsx route, anything rendered here shows
 * on top of every child page too. Missing <Outlet /> here is what caused
 * /wallet/deposit (and friends) to render the Wallet home page instead of
 * their own content.
 */
export const Route = createFileRoute("/wallet")({
  component: () => <Outlet />,
});