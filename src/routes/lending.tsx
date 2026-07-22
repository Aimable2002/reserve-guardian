import { createFileRoute } from "@tanstack/react-router";
import { Lock, Shield, HandCoins, Users } from "lucide-react";

export const Route = createFileRoute("/lending")({
  head: () => ({
    meta: [
      { title: "P2P Lending · Fortress Reserve" },
      {
        name: "description",
        content:
          "Collateralize your vault shares and borrow from other users — coming soon.",
      },
      { property: "og:title", content: "P2P Lending · Fortress Reserve" },
      {
        property: "og:description",
        content: "Borrow against your reserves without withdrawing. Coming soon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LendingPage,
});

function LendingPage() {
  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="py-6">
          <h1 className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            P2P Lending
          </h1>
          <p className="text-lg font-medium">Borrow without withdrawing</p>
        </header>

        <section className="relative overflow-hidden rounded-3xl bg-reserve-navy p-7 text-white shadow-2xl shadow-reserve-navy/20">
          <span className="inline-flex items-center gap-1 rounded-full bg-reserve-emerald/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-reserve-emerald">
            <Lock className="size-3" /> Coming Soon
          </span>
          <h2 className="mt-4 text-2xl font-semibold leading-tight">
            Keep your reserves intact.<br />Access liquidity anyway.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Reserves are meant to sit untouched — that's the point. But life sometimes needs
            cash fast. Instead of breaking a reserve, collateralize your vault shares and
            borrow from other users in the network.
          </p>
          <div className="absolute right-0 top-0 -mr-16 -mt-16 size-48 bg-reserve-emerald/20 blur-3xl" />
        </section>

        <section className="mt-6 space-y-3">
          {[
            {
              Icon: Shield,
              title: "Reserves stay reserved",
              body: "Your target dates and runway don't reset. Funds remain earmarked for their purpose.",
            },
            {
              Icon: HandCoins,
              title: "Borrow against vault shares",
              body: "Lock a portion of your balance as collateral to unlock a short-term loan.",
            },
            {
              Icon: Users,
              title: "Peer-to-peer, transparent",
              body: "Terms are set by lenders in the network. No custodian, no middleman markup.",
            },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-reserve-navy/5 text-reserve-navy">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-reserve-slate">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-reserve-navy/15 bg-white/60 p-5">
          <p className="text-[11px] uppercase tracking-wider text-reserve-slate">Preview</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-reserve-navy/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Borrow up to</p>
              <p className="mt-1 font-mono text-lg font-semibold opacity-40">$—</p>
            </div>
            <div className="rounded-xl bg-reserve-navy/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-reserve-slate">Est. rate</p>
              <p className="mt-1 font-mono text-lg font-semibold opacity-40">—%</p>
            </div>
          </div>
          <button
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-xl bg-reserve-navy py-3 text-sm font-semibold text-white opacity-40"
          >
            Request a loan
          </button>
          <button
            disabled
            className="mt-2 w-full cursor-not-allowed rounded-xl border border-reserve-navy/10 bg-white py-3 text-sm font-semibold text-reserve-navy opacity-40"
          >
            Lend to peers
          </button>
          <p className="mt-3 text-center text-[10px] text-reserve-slate">
            Locked while we finalize the collateral engine.
          </p>
        </section>
      </div>
    </div>
  );
}