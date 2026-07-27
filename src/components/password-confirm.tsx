import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

/**
 * Re-verifies the account password before a withdrawal is submitted.
 * `verifyPassword` throws when the password is wrong, so callers can just
 * `await` it before firing the real mutation.
 */
export async function verifyPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("That password is incorrect.");
}

export function usePasswordConfirm() {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);

  const confirm = async () => {
    if (!user?.email) throw new Error("No signed-in account to verify against.");
    if (!password) throw new Error("Enter your password to confirm.");
    setChecking(true);
    try {
      await verifyPassword(user.email, password);
    } finally {
      setChecking(false);
    }
  };

  const field = (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-reserve-slate">
        Confirm your password
      </Label>
      <Input
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="mt-2"
      />
      <p className="mt-1 flex items-center gap-1 text-[10px] text-reserve-slate">
        {checking && <Loader2 className="size-3 animate-spin" />}
        Required for every withdrawal.
      </p>
    </div>
  );

  return { field, confirm, password, ready: password.length > 0, checking };
}