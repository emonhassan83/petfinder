import { z } from "zod";
import { idParams } from "../../../shared/validation";

const getFees = z.object({ params: idParams("petId") });
const putFees = z.object({
  params: idParams("petId"),
  body: z.object({
    fees: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(80),
          //* Minor units
          amount: z.number().int().min(0).max(100_000_000),
          note: z.string().trim().max(200).optional(),
        })
      )
      .max(20),
  }),
});

export const petFeeValidation = { getFees, putFees };
