/**
 * Sample data for the field-app prototype: the jobs two field staff would see
 * this week on the Amaron South India pilot and the Dewar's Bengaluru job.
 * Mirrors the portal's sample data; replaced by the API in the backend phase.
 */

export type JobKind = "recce" | "install" | "repair";

export interface Person {
  readonly email: string;
  readonly name: string;
  readonly role: "recce" | "installer";
  readonly region: string;
  readonly phone: string;
}

export interface Job {
  readonly id: string;
  readonly kind: JobKind;
  readonly client: "Amaron" | "Dewar's";
  readonly outletCode: string;
  readonly outletName: string;
  readonly address: string;
  readonly city: string;
  readonly contactName: string;
  readonly contactPhone: string;
  /** ISO date of the visit. */
  readonly date: string;
  readonly window: string;
  readonly lat: number;
  readonly lng: number;
  /** From the office: what to look out for. */
  readonly note?: string;
  /** Install and repair jobs: what is going up. */
  readonly sign?: { readonly code: string; readonly label: string; readonly widthMm: number; readonly heightMm: number; readonly qty: number };
  /** Repair jobs: what the outlet reported. */
  readonly issue?: string;
}

export const PEOPLE: readonly Person[] = [
  { email: "suresh@thesignco.demo", name: "Suresh Gowda", role: "recce", region: "South", phone: "+91 98450 11005" },
  { email: "vikram@thesignco.demo", name: "Vikram Singh", role: "recce", region: "North", phone: "+91 98450 11006" },
  { email: "imran@thesignco.demo", name: "Imran Shaikh", role: "installer", region: "South", phone: "+91 98450 11009" },
  { email: "harpreet@thesignco.demo", name: "Harpreet Singh", role: "installer", region: "North", phone: "+91 98450 11010" },
];

const TODAY = "2026-10-16";
const day = (offset: number) => {
  const d = new Date(`${TODAY}T09:00:00+05:30`);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};

export const todayIso = () => day(0);

const RECCE_JOBS: Job[] = [
  { id: "J-R-101", kind: "recce", client: "Amaron", outletCode: "AR482193", outletName: "Sri Venkateswara Batteries", address: "14, Bus Stand Road, Hosur", city: "Hosur", contactName: "Venkat Reddy", contactPhone: "+91 98861 20451", date: day(0), window: "10:00 – 11:00", lat: 12.7409, lng: 77.8253, note: "Old Exide board on the fascia — note if the owner wants it removed." },
  { id: "J-R-102", kind: "recce", client: "Amaron", outletCode: "AR519027", outletName: "Balaji Auto Electricals", address: "NH 44 Service Road, Attibele", city: "Attibele", contactName: "Murali Naidu", contactPhone: "+91 99000 31877", date: day(0), window: "11:30 – 12:30", lat: 12.7795, lng: 77.7706 },
  { id: "J-R-103", kind: "recce", client: "Amaron", outletCode: "AR330814", outletName: "Power Point Battery House", address: "3, Market Road, Electronic City", city: "Bengaluru", contactName: "Arun Shetty", contactPhone: "+91 97411 55210", date: day(0), window: "14:00 – 15:00", lat: 12.8452, lng: 77.6602, note: "Highway-facing — check whether a glow sign is possible (power point?)." },
  { id: "J-R-104", kind: "recce", client: "Amaron", outletCode: "AR700516", outletName: "Lakshmi Battery Centre", address: "88, Hosur Main Road, Bommanahalli", city: "Bengaluru", contactName: "Lakshmi Iyer", contactPhone: "+91 98440 77123", date: day(0), window: "16:00 – 17:00", lat: 12.9081, lng: 77.6239 },
  { id: "J-R-105", kind: "recce", client: "Amaron", outletCode: "AR284466", outletName: "Ganesh Batteries & Co", address: "22, Temple Street, Malleshwaram", city: "Bengaluru", contactName: "Sanjay Rao", contactPhone: "+91 99167 43002", date: day(1), window: "10:00 – 11:00", lat: 13.0035, lng: 77.5709 },
  { id: "J-R-106", kind: "recce", client: "Amaron", outletCode: "AR915308", outletName: "Om Auto Care", address: "5, Station Road, Tumakuru", city: "Tumakuru", contactName: "Prakash Gowda", contactPhone: "+91 98804 10988", date: day(1), window: "13:00 – 14:00", lat: 13.3409, lng: 77.1010 },
  { id: "J-R-107", kind: "recce", client: "Amaron", outletCode: "AR127745", outletName: "Super Battery World", address: "Ring Road, Mysuru", city: "Mysuru", contactName: "Deepak Pillai", contactPhone: "+91 99860 22341", date: day(2), window: "11:00 – 12:00", lat: 12.2958, lng: 76.6394 },
];

const INSTALL_JOBS: Job[] = [
  { id: "J-I-201", kind: "install", client: "Dewar's", outletCode: "16084", outletName: "Grand Vanam", address: "41, Sarjapur Road", city: "Bengaluru", contactName: "Naveen Kumar", contactPhone: "+91 98451 66020", date: day(0), window: "10:00 – 12:00", lat: 12.9105, lng: 77.6858, sign: { code: "GS-S", label: "Glass shelf, made to measure", widthMm: 780, heightMm: 377, qty: 1 }, note: "Shop opens at 10. Glass is fragile — two people to fix." },
  { id: "J-I-202", kind: "install", client: "Dewar's", outletCode: "8325", outletName: "White Horse Spirit (Sura Wines)", address: "9, Old Madras Road", city: "Bengaluru", contactName: "Joseph Das", contactPhone: "+91 97400 18866", date: day(0), window: "12:30 – 14:00", lat: 12.9925, lng: 77.6610, sign: { code: "GS-M", label: "Glass shelf, made to measure", widthMm: 894, heightMm: 387, qty: 1 } },
  { id: "J-I-203", kind: "install", client: "Amaron", outletCode: "AR661204", outletName: "Krishna Battery House", address: "17, MG Road, Mandya", city: "Mandya", contactName: "Ashok Joshi", contactPhone: "+91 99010 47215", date: day(0), window: "15:30 – 17:30", lat: 12.5223, lng: 76.8970, sign: { code: "FB-03", label: "Fascia 10′ × 3′", widthMm: 3048, heightMm: 915, qty: 1 }, note: "Needs a ladder over 3 m. Remove the old board; owner keeps it." },
  { id: "J-I-204", kind: "repair", client: "Amaron", outletCode: "AR208311", outletName: "Royal Power Agencies", address: "2, Gandhi Nagar, Kolar", city: "Kolar", contactName: "Vijay Kumar", contactPhone: "+91 98862 90437", date: day(0), window: "Any time today", lat: 13.1357, lng: 78.1326, sign: { code: "GB-02", label: "Glow sign 8′ × 3′", widthMm: 2438, heightMm: 915, qty: 1 }, issue: "Board lights do not come on in the evening. Raised by the outlet 2 days ago — 22 h left on SLA." },
  { id: "J-I-205", kind: "install", client: "Amaron", outletCode: "AR441870", outletName: "Star Battery Centre", address: "60, Nehru Street, Hosur", city: "Hosur", contactName: "Manoj Verma", contactPhone: "+91 99645 31106", date: day(1), window: "10:00 – 12:00", lat: 12.7360, lng: 77.8312, sign: { code: "LB-02", label: "Low fascia 8′ × 2′", widthMm: 2438, heightMm: 610, qty: 1 } },
  { id: "J-I-206", kind: "install", client: "Dewar's", outletCode: "11667", outletName: "Mysore Tiger", address: "Mysore Road", city: "Bengaluru", contactName: "Sunil Nair", contactPhone: "+91 98863 77015", date: day(2), window: "11:00 – 13:00", lat: 12.9470, lng: 77.5310, sign: { code: "GS-S", label: "Glass shelf, made to measure", widthMm: 710, heightMm: 340, qty: 1 } },
];

/** The jobs assigned to this person. Other field staff get a handful of their own. */
export function jobsFor(person: Person): Job[] {
  const base = person.role === "recce" ? RECCE_JOBS : INSTALL_JOBS;
  if (person.region === "South") return base;
  return base.slice(0, 3).map((j) => ({ ...j, id: `${j.id}-${person.region}` }));
}

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
