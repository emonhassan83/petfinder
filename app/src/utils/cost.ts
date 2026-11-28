//* First-year cost estimate (BDT). Mock constants until real pricing data exists.
import { Size } from "../api/types";

export type FoodTier = "Basic" | "Standard" | "Premium";
export type VetCare = "Essential" | "Routine" | "Comprehensive";

// Monthly food cost by size and tier
export const FOOD_MONTHLY: Record<Size, Record<FoodTier, number>> = {
  Small: { Basic: 1500, Standard: 2500, Premium: 4000 },
  Medium: { Basic: 2500, Standard: 4000, Premium: 6000 },
  Large: { Basic: 4000, Standard: 6500, Premium: 9500 },
};

// Yearly vet care by size and plan (vaccines, check-ups, deworming)
export const VET_YEARLY: Record<Size, Record<VetCare, number>> = {
  Small: { Essential: 4000, Routine: 7000, Comprehensive: 12000 },
  Medium: { Essential: 5500, Routine: 9000, Comprehensive: 15000 },
  Large: { Essential: 7000, Routine: 12000, Comprehensive: 20000 },
};

export const INSURANCE_YEARLY: Record<Size, number> = { Small: 3000, Medium: 4500, Large: 6500 };
export const SUPPLIES_ONE_OFF: Record<Size, number> = { Small: 5000, Medium: 8000, Large: 12000 }; // bed, bowls, leash, toys

export const formatBDT = (n: number) => `৳${n.toLocaleString("en-US")}`;

export type CostLine = { label: string; amount: number };

export const firstYearCost = (size: Size, food: FoodTier, vet: VetCare, insured: boolean) => {
  const lines: CostLine[] = [
    { label: "Food (12 months)", amount: FOOD_MONTHLY[size][food] * 12 },
    { label: "Vet care", amount: VET_YEARLY[size][vet] },
    { label: "Starter supplies", amount: SUPPLIES_ONE_OFF[size] },
  ];
  if (insured) lines.push({ label: "Pet insurance", amount: INSURANCE_YEARLY[size] });
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
};

//* API money is in minor units (BDT paisa); 100 per major unit.
export const formatMinor = (minor: number, currency = "BDT") => {
  const major = Math.round(minor / 100);
  return currency === "BDT" ? formatBDT(major) : `${currency} ${major.toLocaleString("en-US")}`;
};

//* Shape of the public `cost.estimates` setting (major units, currency BDT).
export type CostEstimates = {
  setup: Record<string, number>;
  foodTier: { basic: number; standard: number; premium: number };
  vetYearly: { routine: number; plus: number };
  foodMonthly: Record<string, Record<string, number>>;
  vaccineCost: Record<string, number>;
};

export type VetPlan = "Routine" | "Plus";

//* True when the setting has numbers for this species and size, so the live calculator can be used.
export const hasEstimates = (e: CostEstimates | null, species: string, size: string): e is CostEstimates =>
  !!e && !!e.foodMonthly?.[species]?.[size] && e.setup?.[species] != null && e.vaccineCost?.[species] != null;

export const estimateFirstYear = (e: CostEstimates, species: string, size: string, food: FoodTier, vet: VetPlan, insured: boolean) => {
  const tier = e.foodTier[food.toLowerCase() as keyof CostEstimates["foodTier"]] ?? 1;
  const lines: CostLine[] = [
    { label: "Food (12 months)", amount: Math.round(e.foodMonthly[species][size] * tier * 12) },
    { label: "Vet care", amount: e.vetYearly[vet.toLowerCase() as keyof CostEstimates["vetYearly"]] },
    { label: "Vaccinations", amount: e.vaccineCost[species] },
    { label: "Starter supplies", amount: e.setup[species] },
  ];
  if (insured) lines.push({ label: "Pet insurance", amount: INSURANCE_YEARLY[size as Size] ?? INSURANCE_YEARLY.Medium });
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
};
