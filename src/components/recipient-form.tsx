import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Recipient } from "@/lib/backend";

export type RecipientKind = "bank" | "mobile_money" | "wallet";

export type RecipientFormValue = {
  kind: RecipientKind;
  accountNumber: string;
  bankCode: string;
  network: string;
  phoneDialCode: string;
  phoneNumber: string;
  walletIdentifier: string;
};

export const emptyRecipientForm: RecipientFormValue = {
  kind: "bank",
  accountNumber: "",
  bankCode: "",
  network: "MTN",
  phoneDialCode: "234",
  phoneNumber: "",
  walletIdentifier: "",
};

export function buildRecipient(v: RecipientFormValue): Recipient {
  if (v.kind === "bank") {
    return { type: "bank", bank: { account_number: v.accountNumber.trim(), code: v.bankCode.trim() } };
  }
  if (v.kind === "mobile_money") {
    return {
      type: "mobile_money",
      mobile_money: {
        country_code: v.phoneDialCode.trim(),
        network: v.network,
        phone_number: v.phoneNumber.trim(),
      },
    };
  }
  return { type: "wallet", wallet: { identifier: v.walletIdentifier.trim() } };
}

export function isRecipientValid(v: RecipientFormValue): boolean {
  if (v.kind === "bank") return v.accountNumber.trim().length >= 6 && v.bankCode.trim().length >= 2;
  if (v.kind === "mobile_money") return v.phoneNumber.trim().length >= 6 && !!v.network;
  return v.walletIdentifier.trim().length >= 3;
}

export function recipientLabel(v: RecipientFormValue): string {
  if (v.kind === "bank") return `${v.accountNumber} · ${v.bankCode}`;
  if (v.kind === "mobile_money") return `+${v.phoneDialCode}${v.phoneNumber} (${v.network})`;
  return v.walletIdentifier;
}

const labelCls = "text-[11px] uppercase tracking-wider text-reserve-slate";

export function RecipientForm({
  value,
  onChange,
  allowWallet = true,
}: {
  value: RecipientFormValue;
  onChange: (v: RecipientFormValue) => void;
  allowWallet?: boolean;
}) {
  const set = (patch: Partial<RecipientFormValue>) => onChange({ ...value, ...patch });
  const tabs: { id: RecipientKind; label: string }[] = [
    { id: "bank", label: "Bank" },
    { id: "mobile_money", label: "Mobile money" },
    ...(allowWallet ? [{ id: "wallet" as const, label: "Wallet" }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className={`grid gap-2 ${allowWallet ? "grid-cols-3" : "grid-cols-2"}`}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set({ kind: t.id })}
            className={`rounded-lg border p-2.5 text-[11px] font-medium transition ${
              value.kind === t.id
                ? "border-reserve-navy bg-reserve-navy text-white"
                : "border-reserve-navy/10 bg-white text-reserve-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.kind === "bank" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className={labelCls}>Account number</Label>
            <Input
              inputMode="numeric"
              value={value.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value })}
              placeholder="0122333334"
              className="mt-2 font-mono"
            />
          </div>
          <div>
            <Label className={labelCls}>Bank code</Label>
            <Input
              inputMode="numeric"
              value={value.bankCode}
              onChange={(e) => set({ bankCode: e.target.value })}
              placeholder="044"
              className="mt-2 font-mono"
            />
          </div>
        </div>
      )}

      {value.kind === "mobile_money" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className={labelCls}>Network</Label>
              <select
                value={value.network}
                onChange={(e) => set({ network: e.target.value })}
                className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
              >
                <option value="MTN">MTN</option>
                <option value="AIRTEL">Airtel</option>
                <option value="VODAFONE">Vodafone</option>
                <option value="TIGO">Tigo</option>
                <option value="MPESA">M-Pesa</option>
              </select>
            </div>
            <div>
              <Label className={labelCls}>Dial code</Label>
              <Input
                inputMode="numeric"
                value={value.phoneDialCode}
                onChange={(e) => set({ phoneDialCode: e.target.value })}
                className="mt-2 font-mono"
              />
            </div>
          </div>
          <div>
            <Label className={labelCls}>Phone number</Label>
            <Input
              inputMode="numeric"
              value={value.phoneNumber}
              onChange={(e) => set({ phoneNumber: e.target.value })}
              placeholder="9012345678"
              className="mt-2 font-mono"
            />
          </div>
        </div>
      )}

      {value.kind === "wallet" && (
        <div>
          <Label className={labelCls}>Wallet identifier</Label>
          <Input
            value={value.walletIdentifier}
            onChange={(e) => set({ walletIdentifier: e.target.value })}
            placeholder="handle, email or wallet id"
            className="mt-2"
          />
        </div>
      )}
    </div>
  );
}
