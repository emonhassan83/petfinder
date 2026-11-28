import { z } from "zod";
import { SETTING_KEYS, SETTING_SCHEMAS } from "./setting.constant";

const keyParam = z.object({ params: z.object({ key: z.enum(SETTING_KEYS, { error: "Unknown setting key" }) }) });

//* Body is `{ value, description? }`; `value` is validated against the key's schema in the service.
const updateSetting = z.object({
  params: keyParam.shape.params,
  body: z.object({
    value: z.unknown().refine((v) => v !== undefined, "value is required"),
    description: z.string().trim().max(300).nullable().optional(),
  }),
});

export const settingValidation = { keyParam, updateSetting, SETTING_SCHEMAS };
