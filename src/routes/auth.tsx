import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Fortress Reserve" },
      { name: "description", content: "Sign in to your Fortress Reserve vault to manage reserves, runway and wallet." },
      { property: "og:title", content: "Sign in · Fortress Reserve" },
      { property: "og:description", content: "Access your reserves, runway and spendable wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as { redirect?: string };
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      const to = typeof search?.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : "/";
      navigate({ to, replace: true });
    }
  }, [loading, session, navigate, search]);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      toast.error("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast.error(
        error.message.toLowerCase().includes("provider")
          ? "Google sign-in isn't enabled on this project yet."
          : error.message,
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-reserve-bg px-4 font-sans text-reserve-navy">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Fortress Reserve
          </p>
          <h1 className="mt-1 text-2xl font-medium">
            {mode === "signin" ? "Welcome back" : "Create your vault"}
          </h1>
          <p className="mt-2 text-xs text-reserve-slate">
            Your reserves, runway and spendable wallet in one ledger.
          </p>
        </div>

        <div className="space-y-4 rounded-3xl border border-reserve-navy/5 bg-white p-6 shadow-sm">
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Email</Label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">Password</Label>
            <Input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <Button
            onClick={submit}
            disabled={busy}
            className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
          >
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-reserve-navy/10" />
            <span className="text-[10px] uppercase tracking-wider text-reserve-slate">or</span>
            <span className="h-px flex-1 bg-reserve-navy/10" />
          </div>

          <Button variant="outline" onClick={google} disabled={busy} className="w-full">
            Continue with Google
          </Button>

          <p className="pt-1 text-center text-[11px] text-reserve-slate">
            {mode === "signin" ? "No vault yet?" : "Already have a vault?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-semibold text-reserve-navy underline underline-offset-2"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
