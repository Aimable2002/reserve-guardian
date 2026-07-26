import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Recipient } from "@/lib/backend";

// Only mobile money payouts are live right now — bank and Flutterwave
// merchant-wallet transfers are "coming soon" (400 not_yet_supported for
// anything else), so no tab switcher needed yet.

export type RecipientFormValue = {
  firstName: string;
  lastName: string;
  network: string;
  phoneDialCode: string;
  phoneNumber: string;
};

export const emptyRecipientForm: RecipientFormValue = {
  firstName: "",
  lastName: "",
  network: "MTN",
  phoneDialCode: "250",
  phoneNumber: "",
};

/** msisdn is the full number Flutterwave expects — dial code + number,
 * digits only, no leading "+". */
function buildMsisdn(v: RecipientFormValue): string {
  return `${v.phoneDialCode}${v.phoneNumber}`.replace(/[^0-9]/g, "");
}

export function buildRecipient(v: RecipientFormValue): Recipient {
  return {
    type: "mobile_money",
    name: { first: v.firstName.trim(), last: v.lastName.trim() },
    mobile_money: { network: v.network, msisdn: buildMsisdn(v) },
  };
}

export function isRecipientValid(v: RecipientFormValue): boolean {
  return (
    !!v.firstName.trim() &&
    !!v.lastName.trim() &&
    !!v.network &&
    v.phoneNumber.trim().length >= 6
  );
}

export function recipientLabel(v: RecipientFormValue): string {
  return `${v.firstName} ${v.lastName} · +${buildMsisdn(v)} (${v.network})`.trim();
}

const labelCls = "text-[11px] uppercase tracking-wider text-reserve-slate";

export function RecipientForm({
  value,
  onChange,
}: {
  value: RecipientFormValue;
  onChange: (v: RecipientFormValue) => void;
}) {
  const set = (patch: Partial<RecipientFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-reserve-navy/10 bg-reserve-navy/[0.03] p-2.5 text-center text-[11px] font-medium text-reserve-navy">
        Mobile money
        <span className="ml-1.5 font-normal text-reserve-slate">
          — bank & wallet transfers coming soon
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className={labelCls}>First name</Label>
          <Input
            value={value.firstName}
            onChange={(e) => set({ firstName: e.target.value })}
            className="mt-2"
          />
        </div>
        <div>
          <Label className={labelCls}>Last name</Label>
          <Input
            value={value.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>

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
          placeholder="780000000"
          className="mt-2 font-mono"
        />
      </div>
    </div>
  );
}