import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { DEFAULT_CURRENCY } from "@/lib/reserve-data";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account · Fortress Reserve" },
      { name: "description", content: "Update your display name, default currency and password." },
      { property: "og:title", content: "Account · Fortress Reserve" },
      { property: "og:description", content: "Manage your Fortress Reserve profile and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const CURRENCIES = ["RWF", "NGN", "KES", "UGX", "GHS", "USD", "EUR"];

function AccountPage() {
  const { user, signOut } = useAuth();
  const store = useStore();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, default_currency")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (error) toast.error(error.message);
      setDisplayName(data?.display_name ?? "");
      setDefaultCurrency(data?.default_currency ?? DEFAULT_CURRENCY);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, display_name: displayName.trim() || null, default_currency: defaultCurrency },
          { onConflict: "id" },
        );
      if (error) throw error;
      toast.success("Profile updated.");
      await store.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) return toast.error("Use at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords don't match.");
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      toast.success("Password changed.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-reserve-bg font-sans text-reserve-navy">
      <div
        className="mx-auto w-full max-w-md px-4 pb-32"
        style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold text-reserve-slate active:opacity-70">
            <ArrowLeft className="size-4" /> Vault
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-reserve-slate">
            Account
          </span>
        </header>

        <h1 className="text-xl font-medium">Your account</h1>
        <p className="mt-1 truncate text-xs text-reserve-slate">{user?.email}</p>

        <section className="mt-6 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Profile</h2>
          {loading ? (
            <Loader2 className="size-4 animate-spin text-reserve-slate" />
          ) : (
            <>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                  Display name
                </Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How others see you on shared reserves"
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
                  Default currency
                </Label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={saveProfile}
                disabled={savingProfile}
                className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
              >
                {savingProfile && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save profile
              </Button>
            </>
          )}
        </section>

        <section className="mt-6 space-y-4 rounded-2xl border border-reserve-navy/5 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Change password</h2>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
              New password
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
              Confirm new password
            </Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2"
            />
          </div>
          <Button
            onClick={savePassword}
            disabled={savingPassword}
            className="w-full bg-reserve-navy text-white hover:bg-reserve-navy/90"
          >
            {savingPassword && <Loader2 className="mr-2 size-4 animate-spin" />}
            Update password
          </Button>
        </section>

        <section className="mt-6">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="w-full border-destructive/20 text-destructive"
          >
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </section>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}