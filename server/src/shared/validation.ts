import { z } from "zod";

//* Reusable Zod pieces for `validateRequest` schemas ({ body?, query?, params? }).

export const zId = z.uuid({ error: "Invalid id" });

//* `{ params: idParams("petId") }` -> validates req.params.petId as a uuid
export const idParams = <K extends string>(...keys: K[]) =>
  z.object(Object.fromEntries(keys.map((k) => [k, zId])) as Record<K, typeof zId>);

//* Pagination + sorting for list endpoints. Pass the sortable fields so `sortBy` cannot reach arbitrary columns.
export const paginationQuery = (sortable: [string, ...string[]] = ["createdAt"]) => ({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(sortable).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  searchTerm: z.string().trim().max(100).optional(),
});

//* Query string boolean: "true"/"false"/"1"/"0"
export const zBoolQuery = z
  .enum(["true", "false", "1", "0"])
  .transform((v) => v === "true" || v === "1");
