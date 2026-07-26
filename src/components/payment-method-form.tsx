import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlutterwaveCustomer, PaymentMethod } from "@/lib/backend";

export type PaymentMethodKind = "card" | "bank_transfer" | "mobile_money";

const TABS: { id: PaymentMethodKind; label: string }[] = [
  { id: "card", label: "Card" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "mobile_money", label: "Mobile money" },
];

export type PaymentFormValue = {
  kind: PaymentMethodKind;
  // card
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  // shared
  countryCode: string;
  network: string;
  phoneNumber: string;
  phoneDialCode: string;
  // customer
  email: string;
  firstName: string;
  lastName: string;
};

export const emptyPaymentForm: PaymentFormValue = {
  kind: "card",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
  countryCode: "NG",
  network: "MTN",
  phoneNumber: "",
  phoneDialCode: "234",
  email: "",
  firstName: "",
  lastName: "",
};

export function buildPaymentMethod(v: PaymentFormValue): PaymentMethod {
  if (v.kind === "card") {
    return {
      type: "card",
      card: {
        card_number: v.cardNumber.replace(/\s+/g, ""),
        expiry_month: v.expiryMonth.padStart(2, "0"),
        expiry_year: v.expiryYear,
        cvv: v.cvv,
      },
    };
  }
  if (v.kind === "mobile_money") {
    return {
      type: "mobile_money",
      mobile_money: {
        country_code: v.phoneDialCode,
        network: v.network,
        phone_number: v.phoneNumber,
      },
    };
  }
  return { type: "bank_transfer", bank_transfer: { country_code: v.countryCode, expires_in: 3600 } };
}

export function buildCustomer(v: PaymentFormValue): FlutterwaveCustomer {
  return {
    email: v.email.trim(),
    name: { first: v.firstName.trim() || "Reserve", last: v.lastName.trim() || "User" },
    ...(v.phoneNumber
      ? { phone: { country_code: v.phoneDialCode, number: v.phoneNumber } }
      : {}),
  };
}

export function isPaymentFormValid(v: PaymentFormValue): boolean {
  if (!v.email.trim().includes("@")) return false;
  if (v.kind === "card") {
    return (
      v.cardNumber.replace(/\s+/g, "").length >= 12 &&
      !!v.expiryMonth &&
      !!v.expiryYear &&
      v.cvv.length >= 3
    );
  }
  if (v.kind === "mobile_money") return !!v.network && v.phoneNumber.length >= 6;
  return !!v.countryCode;
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
  const [showAll] = useState(true);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
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

      {value.kind === "card" && (
        <div className="space-y-3">
          <div>
            <Label className={labelCls}>Card number</Label>
            <Input
              inputMode="numeric"
              value={value.cardNumber}
              onChange={(e) => set({ cardNumber: e.target.value })}
              placeholder="5531 8866 5214 2950"
              className={`${field} font-mono`}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className={labelCls}>MM</Label>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={value.expiryMonth}
                onChange={(e) => set({ expiryMonth: e.target.value })}
                placeholder="09"
                className={`${field} font-mono`}
              />
            </div>
            <div>
              <Label className={labelCls}>YY</Label>
              <Input
                inputMode="numeric"
                maxLength={2}
                value={value.expiryYear}
                onChange={(e) => set({ expiryYear: e.target.value })}
                placeholder="32"
                className={`${field} font-mono`}
              />
            </div>
            <div>
              <Label className={labelCls}>CVV</Label>
              <Input
                inputMode="numeric"
                maxLength={4}
                value={value.cvv}
                onChange={(e) => set({ cvv: e.target.value })}
                placeholder="564"
                className={`${field} font-mono`}
              />
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-reserve-slate">
            Card details go straight to the backend, which encrypts them for Flutterwave. 3-D Secure
            or OTP steps open automatically after you confirm.
          </p>
        </div>
      )}

      {value.kind === "bank_transfer" && (
        <div className="space-y-3">
          <div>
            <Label className={labelCls}>Country</Label>
            <select
              value={value.countryCode}
              onChange={(e) => set({ countryCode: e.target.value })}
              className="mt-2 w-full rounded-lg border border-reserve-navy/10 bg-white p-3 text-sm"
            >
              <option value="NG">Nigeria (NG)</option>
              <option value="GH">Ghana (GH)</option>
              <option value="KE">Kenya (KE)</option>
              <option value="ZA">South Africa (ZA)</option>
            </select>
          </div>
          <p className="text-[10px] leading-relaxed text-reserve-slate">
            You'll get one-time account details to transfer into. The wallet updates once the
            transfer is confirmed.
          </p>
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
                placeholder="233"
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
              placeholder="9012345678"
              className={`${field} font-mono`}
            />
          </div>
        </div>
      )}

      {showAll && (
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
      )}
    </div>
  );
}
