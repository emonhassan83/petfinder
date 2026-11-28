import { z } from "zod";
import { idParams, zBoolQuery, zId } from "../../../shared/validation";

const name = z.string().trim().min(1).max(100);
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug")
  .max(120);

const listQuery = z.object({ includeInactive: zBoolQuery.optional() });

const listSpecies = z.object({ query: listQuery });
const listLocations = z.object({ query: listQuery });
const listBreeds = z.object({ query: listQuery.extend({ speciesId: zId.optional() }) });

const nonEmpty = (b: object) => Object.keys(b).length > 0;

const speciesBody = z.object({
  name,
  slug: slug.optional(),
  icon: z.string().trim().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});
const createSpecies = z.object({ body: speciesBody });
const updateSpecies = z.object({
  params: idParams("id"),
  body: speciesBody.partial().refine(nonEmpty, "Nothing to update"),
});

const breedBody = z.object({ speciesId: zId, name, slug: slug.optional(), isActive: z.boolean().optional() });
const createBreed = z.object({ body: breedBody });
const updateBreed = z.object({
  params: idParams("id"),
  body: breedBody.partial().refine(nonEmpty, "Nothing to update"),
});

const locationBody = z.object({
  name,
  slug: slug.optional(),
  city: z.string().trim().max(100).nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().min(1).max(100).optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
});
const createLocation = z.object({ body: locationBody });
const updateLocation = z.object({
  params: idParams("id"),
  body: locationBody.partial().refine(nonEmpty, "Nothing to update"),
});

const idParam = z.object({ params: idParams("id") });

export const lookupValidation = {
  listSpecies,
  listBreeds,
  listLocations,
  createSpecies,
  updateSpecies,
  createBreed,
  updateBreed,
  createLocation,
  updateLocation,
  idParam,
};
