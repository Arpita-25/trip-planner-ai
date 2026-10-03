// Display formatting only. All money math is computed by the backend (lib/budget.py).

const SYMBOLS: Record<string, string> = {
  INR: "\u20B9",
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  AED: "AED ",
  SGD: "S$",
  THB: "\u0E3F",
  JPY: "\u00A5",
};

export function currencySymbol(currency: string): string {
  return SYMBOLS[currency?.toUpperCase()] ?? `${currency} `;
}

/** Indian grouping for INR (1,20,000), western grouping otherwise. */
export function formatMoney(amount: number, currency = "INR"): string {
  const rounded = Math.round(amount ?? 0);
  const locale = currency?.toUpperCase() === "INR" ? "en-IN" : "en-US";
  return `${currencySymbol(currency)}${Math.abs(rounded).toLocaleString(locale)}`;
}

export function formatSignedMoney(amount: number, currency = "INR"): string {
  const prefix = amount < 0 ? "-" : "";
  return `${prefix}${formatMoney(amount, currency)}`;
}

/** 120000 -> "1.2 Lakh" for INR headlines; falls back to plain formatting elsewhere. */
export function formatCompactMoney(amount: number, currency = "INR"): string {
  if (currency?.toUpperCase() !== "INR") return formatMoney(amount, currency);
  const value = Math.round(amount ?? 0);
  if (value >= 10000000) return `${currencySymbol(currency)}${(value / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (value >= 100000) return `${currencySymbol(currency)}${(value / 100000).toFixed(2).replace(/\.00$/, "")} Lakh`;
  return formatMoney(value, currency);
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes ?? 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function formatDateRange(start: string, end: string): string {
  const a = new Date(`${start}T00:00:00`);
  const b = new Date(`${end}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return `${start} – ${end}`;
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${a.toLocaleDateString("en-GB", opts)} – ${b.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
}

/** 12:00 -> 12:00 (already display-ready); guards odd AI output. */
export function formatSlotTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? "");
  if (!match) return value ?? "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const CATEGORY_META: Record<string, { label: string; tint: string }> = {
  food: { label: "Food", tint: "bg-amber-50 text-amber-900 border-amber-200" },
  nightlife: { label: "Nightlife", tint: "bg-violet-50 text-violet-900 border-violet-200" },
  activities: { label: "Activity", tint: "bg-teal-50 text-teal-900 border-teal-200" },
  places: { label: "Place", tint: "bg-sky-50 text-sky-900 border-sky-200" },
  transport: { label: "Transport", tint: "bg-stone-100 text-stone-700 border-stone-200" },
  stay: { label: "Stay", tint: "bg-rose-50 text-rose-900 border-rose-200" },
  shopping: { label: "Shopping", tint: "bg-lime-50 text-lime-900 border-lime-200" },
};
