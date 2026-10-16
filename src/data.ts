/** What the field app works with: jobs from GET /api/field/jobs, and the fixed lists of a visit. */

export type JobKind = "recce" | "install" | "repair";

export interface Person {
  readonly email: string;
  readonly name: string;
  readonly role: "recce" | "installer";
  readonly region?: string;
  readonly phone?: string;
}

export interface Job {
  readonly id: string;
  readonly kind: JobKind;
  readonly outletId: string;
  /** Repair jobs: the maintenance ticket being worked. */
  readonly ticketId?: string;
  readonly client: string;
  readonly outletCode: string;
  readonly outletName: string;
  readonly address: string;
  readonly city: string;
  readonly contactName: string;
  readonly contactPhone: string;
  /** ISO time of the visit (repairs: when the issue was reported). */
  readonly date: string;
  /** Known after the recce; 0 before. */
  readonly lat: number;
  readonly lng: number;
  /** From the office or the recce: what to look out for. */
  readonly note?: string;
  /** Install and repair jobs: what is going up. */
  readonly sign?: { readonly code: string; readonly label: string; readonly widthMm: number; readonly heightMm: number; readonly qty: number };
  /** Repair jobs: what was reported. */
  readonly issue?: string;
}

/** "10:00", or a fallback when no time of day was set. */
export function timeOf(job: Job): string {
  if (job.kind === "repair") return "Any time";
  const d = new Date(job.date);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
}

export const isToday = (iso: string) => {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return day(new Date(iso)) <= day(new Date());
};

export const MOUNTINGS = ["Shop fascia", "Wall", "Projecting", "Shelf strip", "Glass shelf"] as const;
export type Mounting = (typeof MOUNTINGS)[number];

/** The shots a recce must include before it can be submitted. */
export const RECCE_SHOTS = [
  { id: "front", label: "Shop front", hint: "Whole shop, straight on, from across the road" },
  { id: "spot", label: "Mounting spot with tape", hint: "Tape measure visible across the width" },
  { id: "left", label: "Left side", hint: "Neighbouring shop or wall" },
  { id: "right", label: "Right side", hint: "Neighbouring shop or wall" },
  { id: "power", label: "Power point", hint: "Only if a lit sign is possible", optional: true },
] as const;

export const INSTALL_CHECKS = [
  "Sign is level",
  "Fixed securely — no movement by hand",
  "Lights work (if illuminated)",
  "Wiring covered and safe",
  "Old board removed as agreed",
  "Site cleaned, debris taken away",
] as const;
