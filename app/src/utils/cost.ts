//* First-year cost estimate (BDT). Mock constants until real pricing data exists.
import { Size } from "../data/mock";

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
