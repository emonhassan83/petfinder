//* Fee breakdown and first-year cost estimates (BDT, major units). Live pets use GET /pets/:id/fees for
//* the fee lines and the `cost.estimates` public setting for the calculator; the constants below are the
//* offline/preview fallback and mirror the seeded setting.

export type FeeLine = { label: string; amount: number; note?: string };

type FeePet = { species: string; fee?: number; vaccinated?: boolean; spayedNeutered?: boolean };

const vaccineCost: Record<string, number> = { Dog: 1500, Cat: 1200, Rabbit: 600 };

//* Splits the listed adoption fee into what it covers; lines always sum to `fee`.
export const getFeeBreakdown = (pet: FeePet): FeeLine[] => {
  const fee = pet.fee ?? 0;
  if (!fee) return [];
  const lines: FeeLine[] = [];
  if (pet.vaccinated) lines.push({ label: "Vaccinations", amount: vaccineCost[pet.species] ?? 1000, note: "Core vaccines given" });
  if (pet.species !== "Rabbit") lines.push({ label: "Microchip", amount: 800, note: "Registered to you" });
  if (pet.spayedNeutered) lines.push({ label: "Spay / neuter", amount: pet.species === "Dog" ? 2500 : 1800 });
  lines.push({ label: "Vet check & deworming", amount: 700 });
  const covered = lines.reduce((s, l) => s + l.amount, 0);
  //* Whatever is left supports the shelter; if the fee is lower than the costs, show the costs scaled down
  if (covered <= fee) return [...lines, { label: "Shelter care donation", amount: fee - covered, note: "Food, housing and rescue of the next pet" }];
  const scale = fee / covered;
  let used = 0;
  return lines.map((l, i) => {
    const amount = i === lines.length - 1 ? fee - used : Math.round(l.amount * scale);
    used += amount;
    return { ...l, amount };
  });
};

export type CostInputs = {
  species: string;
  size: "Small" | "Medium" | "Large";
  food: "basic" | "standard" | "premium";
  vet: "routine" | "plus";
  insurance: boolean;
  grooming: boolean;
};

//* Monthly food by species/size, multiplied by tier
const foodMonthly: Record<string, Record<CostInputs["size"], number>> = {
  Dog: { Small: 1800, Medium: 3200, Large: 5000 },
  Cat: { Small: 1500, Medium: 1900, Large: 2300 },
  Rabbit: { Small: 1200, Medium: 1400, Large: 1600 },
};
const foodTier = { basic: 0.8, standard: 1, premium: 1.5 };
const vetYearly = { routine: 4000, plus: 9000 };
const setup: Record<string, number> = { Dog: 6000, Cat: 5000, Rabbit: 4500 }; // bed, bowls, lead/litter, toys, carrier

//* Shape of the `cost.estimates` setting (GET /settings/public); any missing part falls back to the defaults
export type CostEstimates = {
  currency?: string;
  setup?: Record<string, number>;
  foodMonthly?: Record<string, Record<CostInputs["size"], number>>;
  foodTier?: Partial<Record<CostInputs["food"], number>>;
  vetYearly?: Partial<Record<CostInputs["vet"], number>>;
};

export const estimateFirstYear = (i: CostInputs, adoptionFee = 0, est?: CostEstimates) => {
  const food = est?.foodMonthly ?? foodMonthly;
  const species = food[i.species] ? i.species : foodMonthly[i.species] ? i.species : "Dog";
  const monthly = food[species]?.[i.size] ?? foodMonthly[species]?.[i.size] ?? foodMonthly.Dog[i.size];
  const lines: FeeLine[] = [
    { label: "Adoption fee", amount: adoptionFee },
    { label: "Starter supplies", amount: est?.setup?.[species] ?? setup[species] ?? setup.Dog },
    { label: "Food (12 months)", amount: Math.round(monthly * (est?.foodTier?.[i.food] ?? foodTier[i.food]) * 12) },
    { label: i.vet === "plus" ? "Vet care (plus)" : "Vet care (routine)", amount: est?.vetYearly?.[i.vet] ?? vetYearly[i.vet] },
  ];
  if (i.insurance) lines.push({ label: "Pet insurance", amount: species === "Dog" ? 7200 : 5400 });
  if (i.grooming) lines.push({ label: "Grooming", amount: species === "Dog" ? (i.size === "Large" ? 9000 : 6000) : 3000 });
  return { lines: lines.filter((l) => l.amount > 0), total: lines.reduce((s, l) => s + l.amount, 0) };
};

export const taka = (n: number) => `৳${n.toLocaleString("en-IN")}`;
