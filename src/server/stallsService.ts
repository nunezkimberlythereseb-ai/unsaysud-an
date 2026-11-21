import crypto from "crypto";
import path from "path";
import type { StallOperationalStatus, StallRecord, StallRegistrationStatus } from "../types";
import { DATA_DIR, readJsonFile, writeJsonFile } from "./storage";

const STALLS_FILE = path.join(DATA_DIR, "stalls.json");

export const CAMPUS_STALL_TEMPLATES: {
  stallNo: string;
  officialName: string;
  name: string;
  zone: "outside" | "inside";
}[] = [
  { stallNo: "Stall 1", officialName: "Swirly Bits", name: "Stall 1 — Swirly Bits", zone: "outside" },
  { stallNo: "Stall 2", officialName: "Java Rice", name: "Stall 2 — Java Rice", zone: "outside" },
  { stallNo: "Stall 3", officialName: "Bread Stall", name: "Stall 3 — Bread Stall", zone: "outside" },
  { stallNo: "Stall 4", officialName: "Pinoy Food Toppings", name: "Stall 4 — Pinoy Food Toppings", zone: "outside" },
  { stallNo: "Stall 5", officialName: "4J Food Stall", name: "Stall 5 — 4J Food Stall", zone: "outside" },
  { stallNo: "Stall 6", officialName: "R&M Refreshment Stall", name: "Stall 6 — R&M Refreshment Stall", zone: "outside" },
  { stallNo: "Stall 7", officialName: "Judah Food 7 & Drinks", name: "Stall 7 — Judah Food 7 & Drinks", zone: "outside" },
  { stallNo: "Stall 8A", officialName: "StreetFood Stall", name: "Stall 8A — StreetFood Stall", zone: "outside" },
  { stallNo: "Stall 8B", officialName: "Juice Bar & Popcorn", name: "Stall 8B — Juice Bar & Popcorn", zone: "outside" },
  { stallNo: "Stall 9", officialName: "Fresh Fruit Bar", name: "Stall 9 — Fresh Fruit Bar", zone: "outside" },
  { stallNo: "Stall 10", officialName: "Master Dumpling", name: "Stall 10 — Master Dumpling", zone: "inside" },
  { stallNo: "Stall 11", officialName: "Deeyang by: Pops Dessert", name: "Stall 11 — Deeyang by: Pops Dessert", zone: "inside" },
  { stallNo: "Stall 12", officialName: "Gulaman District", name: "Stall 12 — Gulaman District", zone: "inside" },
  { stallNo: "Stall 13", officialName: "Val's FoodHub", name: "Stall 13 — Val's FoodHub", zone: "inside" },
  { stallNo: "Stall 14", officialName: "Shamir Food Houz", name: "Stall 14 — Shamir Food Houz", zone: "inside" },
  { stallNo: "Stall 15", officialName: "France Bistro", name: "Stall 15 — France Bistro", zone: "inside" }
];

export function readStalls(): StallRecord[] {
  return readJsonFile<StallRecord[]>(STALLS_FILE, []);
}

export function writeStalls(stalls: StallRecord[]): boolean {
  return writeJsonFile(STALLS_FILE, stalls);
}

export function getStallByName(stallName: string): StallRecord | undefined {
  const stalls = readStalls();
  return stalls.find((s) => s.name.toLowerCase() === stallName.toLowerCase());
}

export function getAvailableCampusTemplates() {
  const registeredNames = new Set(readStalls().map((s) => s.name.toLowerCase()));
  return CAMPUS_STALL_TEMPLATES.map((tpl) => ({
    ...tpl,
    isRegistered: registeredNames.has(tpl.name.toLowerCase())
  }));
}

export function createStallRecord(params: {
  stallName: string;
  stallNo?: string;
  officialName?: string;
  zone: "outside" | "inside";
  description: string;
  contactInfo: string;
  email: string;
  ownerId: string;
  ownerName: string;
  registrationStatus?: StallRegistrationStatus;
}): StallRecord {
  const stalls = readStalls();
  const now = new Date().toISOString();
  const parts = params.stallName.split("—");
  const computedStallNo = params.stallNo || (parts.length > 1 ? parts[0].trim() : `Stall ${stalls.length + 1}`);
  const computedOfficial = params.officialName || (parts.length > 1 ? parts[1].trim() : params.stallName);

  const record: StallRecord = {
    id: `stall_${crypto.randomBytes(6).toString("hex")}`,
    stallNo: computedStallNo,
    name: params.stallName.trim(),
    officialName: computedOfficial,
    zone: params.zone,
    description: params.description.trim(),
    contactInfo: params.contactInfo.trim(),
    email: params.email.trim().toLowerCase(),
    ownerId: params.ownerId,
    ownerName: params.ownerName.trim(),
    status: "active",
    registrationStatus: params.registrationStatus || "approved",
    createdAt: now,
    updatedAt: now
  };

  stalls.push(record);
  writeStalls(stalls);
  return record;
}

export function updateStallStatusAdmin(
  stallName: string,
  updates: {
    status?: StallOperationalStatus;
    registrationStatus?: StallRegistrationStatus;
    suspensionReason?: string;
  }
): { success: boolean; stall?: StallRecord; previousStatus?: string; error?: string } {
  const stalls = readStalls();
  const idx = stalls.findIndex((s) => s.name.toLowerCase() === stallName.toLowerCase());
  if (idx === -1) {
    return { success: false, error: `Stall "${stallName}" not found.` };
  }

  const prev = `${stalls[idx].status}/${stalls[idx].registrationStatus}`;
  if (updates.status !== undefined) {
    stalls[idx].status = updates.status;
    if (updates.status !== "suspended") {
      stalls[idx].suspensionReason = undefined;
    }
  }
  if (updates.registrationStatus !== undefined) {
    stalls[idx].registrationStatus = updates.registrationStatus;
  }
  if (updates.suspensionReason !== undefined) {
    stalls[idx].suspensionReason = updates.suspensionReason;
  }
  stalls[idx].updatedAt = new Date().toISOString();
  writeStalls(stalls);

  return { success: true, stall: stalls[idx], previousStatus: prev };
}

export function isStallOperationallyEligible(stallName: string): boolean {
  const stall = getStallByName(stallName);
  if (!stall) return false;
  return stall.status === "active" && stall.registrationStatus === "approved";
}
