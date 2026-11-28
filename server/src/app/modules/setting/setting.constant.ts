import { z } from "zod";

const money = z.number().min(0).max(100000000);
const moneyMap = z.record(z.string().min(1).max(40), money);

//* Known setting keys and the Zod schema their value must satisfy. Unknown keys are rejected.
export const SETTING_SCHEMAS = {
  "cost.estimates": z.object({
    currency: z.string().trim().min(1).max(8),
    vaccineCost: moneyMap,
    foodMonthly: z.record(z.string().min(1).max(40), moneyMap),
    foodTier: moneyMap,
    vetYearly: moneyMap,
    setup: moneyMap,
  }),
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;
export const SETTING_KEYS = Object.keys(SETTING_SCHEMAS) as [SettingKey, ...SettingKey[]];

//* Keys exposed by GET /settings/public
export const PUBLIC_SETTING_KEYS: SettingKey[] = ["cost.estimates"];
