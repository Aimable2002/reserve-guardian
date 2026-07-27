import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { acceptInvite } from "@/lib/shared-reserves";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Reserve invitation · Fortress Reserve" },
      { name: "description", content: "Accept your invitation to join a shared reserve." },
      { property: "og:title", content: "Reserve invitation · Fortress Reserve" },
      { property: "og:description", content: "Join a shared reserve on Fortress Reserve." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvitePage,
});

const MESSAGES: Record<string, string> = {
  used: "This invite link has already been used. Ask the owner for a new one.",
  revoked: "This invite was revoked by the reserve owner.",
  expired: "This invite has expired. Ask the owner to send a fresh link.",
  not_found: "We couldn't find that invite link.",
  other: "This invite couldn't be accepted.",
};

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const accept = useCallback(async () => {
    if (!user) return;
    setState("working");
    const res = await acceptInvite(token, user.id);
    if (res.ok) {
      setState("done");
      navigate(
        res.reserveId
          ? { to: "/reserves/$id", params: { id: res.reserveId }, replace: true }
          : { to: "/", replace: true },
      );
    } else {
      setError(MESSAGES[res.reason] ?? res.message);
      setState("error");
    }
  }, [token, user, navigate]);

  // Signed-in visitors accept straight away; signed-out visitors sign up first
  // and come straight back here via the redirect search param.
  useEffect(() => {
    if (!loading && user && state === "idle") void accept();
  }, [loading, user, state, accept]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-reserve-bg px-4 font-sans text-reserve-navy">
      <div className="w-full max-w-sm rounded-3xl border border-reserve-navy/5 bg-white p-6 text-center shadow-sm">
        {loading || state === "working" || state === "done" ? (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-reserve-navy" />
            <p className="mt-4 text-sm text-reserve-slate">Checking your invitation…</p>
          </>
        ) : state === "error" ? (
          <>
            <ShieldX className="mx-auto size-8 text-destructive" />
            <h1 className="mt-4 text-lg font-medium">Invitation unavailable</h1>
            <p className="mt-2 text-xs text-reserve-slate">{error}</p>
            <Link to="/" className="mt-6 block">
              <Button className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90">
                Go to your vault
              </Button>
            </Link>
          </>
        ) : (
          <>
            <ShieldCheck className="mx-auto size-8 text-reserve-emerald" />
            <h1 className="mt-4 text-lg font-medium">You've been invited</h1>
            <p className="mt-2 text-xs text-reserve-slate">
              Create an account or sign in to join this shared reserve. We'll bring you right back
              here.
            </p>
            <Button
              onClick={() =>
                navigate({ to: "/auth", search: { redirect: `/invite/${token}` } })
              }
              className="mt-6 w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
            >
              Sign in or sign up
            </Button>
          </>
        )}
      </div>
    </div>
  );
}