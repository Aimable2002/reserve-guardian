import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlutterwaveCustomer, PaymentMethod } from "@/lib/backend";

// Only mobile money is live right now — card and bank transfer are "coming
// soon" (the backend returns 400 not_yet_supported for anything else), so
// there's nothing to build a tab switcher between yet.

export type PaymentFormValue = {
  countryCode: string;
  network: string;
  phoneNumber: string;
  phoneDialCode: string;
  email: string;
  firstName: string;
  lastName: string;
};

export const emptyPaymentForm: PaymentFormValue = {
  countryCode: "RW",
  network: "MTN",
  phoneNumber: "",
  phoneDialCode: "250",
  email: "",
  firstName: "",
  lastName: "",
};

export function buildPaymentMethod(v: PaymentFormValue): PaymentMethod {
  return {
    type: "mobile_money",
    mobile_money: {
      country_code: v.phoneDialCode,
      network: v.network,
      phone_number: v.phoneNumber.trim(),
    },
  };
}

export function buildCustomer(v: PaymentFormValue): FlutterwaveCustomer {
  return {
    email: v.email.trim(),
    name: { first: v.firstName.trim(), last: v.lastName.trim() },
    phone: { country_code: v.phoneDialCode, number: v.phoneNumber.trim() },
  };
}

export function isPaymentFormValid(v: PaymentFormValue): boolean {
  return (
    v.email.trim().includes("@") &&
    !!v.firstName.trim() &&
    !!v.lastName.trim() &&
    !!v.network &&
    v.phoneNumber.trim().length >= 6
  );
}

const field = "mt-2";
const labelCls = "text-[11px] uppercase tracking-wider text-reserve-slate";

export function PaymentMethodForm({
  value,
  onChange,
}: {
  value: PaymentFormValue;
  onChange: (v: PaymentFormValue) => void;
}) {
  const set = (patch: Partial<PaymentFormValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-reserve-navy/10 bg-reserve-navy/[0.03] p-2.5 text-center text-[11px] font-medium text-reserve-navy">
        Mobile money
        <span className="ml-1.5 font-normal text-reserve-slate">
          — card & bank transfer coming soon
        </span>
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
            placeholder="250"
            className={`${field} font-mono`}
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
          className={`${field} font-mono`}
        />
      </div>

      <div className="space-y-3 border-t border-reserve-navy/5 pt-4">
        <div>
          <Label className={labelCls}>Email</Label>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
            className={field}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className={labelCls}>First name</Label>
            <Input
              value={value.firstName}
              onChange={(e) => set({ firstName: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <Label className={labelCls}>Last name</Label>
            <Input
              value={value.lastName}
              onChange={(e) => set({ lastName: e.target.value })}
              className={field}
            />
          </div>
        </div>
      </div>
    </div>
  );
}