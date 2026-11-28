import { Gender, PetStatus } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";
import { MANUAL_STATUSES, petSortableFields } from "./pet.constant";

const text = (label: string, max = 2000) => z.string({ error: `${label} is required!` }).trim().min(1).max(max);
const optText = (max = 2000) => z.string().trim().max(max);

const petBody = {
  name: text("Name", 100),
  image: z.string().trim().max(2048).optional(),
  //* Lookup ids (preferred); legacy free text is kept for older clients
  speciesId: zId.optional(),
  //* null (update only) clears the breed
  breedId: zId.nullable().optional(),
  locationId: zId.optional(),
  species: optText(60).optional(),
  breed: optText(80).optional(),
  location: optText(120).optional(),
  color: optText(60).optional(),
  colors: z.array(z.string().trim().min(1).max(40)).max(8).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  age: z.number({ error: "Age is required!" }).int().min(0).max(40),
  gender: z.enum(Gender, { error: "Gender must be Male, Female or Unknown" }),
  size: text("Size", 30),
  description: text("Description", 5000),
  temperament: optText().optional(),
  medicalHistory: optText().optional(),
  healthStatus: optText(500).optional(),
  adoptionRequirements: optText().optional(),
};

const createPet = z.object({
  body: z.object({
    ...petBody,
    //* DRAFT (default) or PUBLISHED; publishing counts against the plan's listing limit
    status: z.enum([PetStatus.DRAFT, PetStatus.PUBLISHED]).optional(),
    //* Admins only: list on behalf of a shelter
    shelterId: zId.optional(),
  }),
});

const updatePet = z.object({
  params: idParams("petId"),
  body: z.object(petBody).partial(),
});

const geoQuery = {
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  //* kilometres
  radius: z.coerce.number().min(1).max(500).optional(),
};

const getPets = z.object({
  query: z
    .object({
      ...paginationQuery(petSortableFields),
      speciesId: zId.optional(),
      breedId: zId.optional(),
      locationId: zId.optional(),
      shelterId: zId.optional(),
      species: z.string().trim().max(60).optional(),
      breed: z.string().trim().max(80).optional(),
      location: z.string().trim().max(120).optional(),
      age: z.coerce.number().int().min(0).max(40).optional(),
      size: z.string().trim().max(30).optional(),
      color: z.string().trim().max(60).optional(),
      //* comma separated keywords, any match (e.g. colors=black,white)
      colors: z.string().trim().max(200).optional(),
      gender: z.enum(Gender).optional(),
      featured: z.enum(["true", "1"]).optional(),
      ...geoQuery,
    })
    .refine((q) => (q.lat === undefined) === (q.lng === undefined), { message: "lat and lng must be sent together" })
    .refine((q) => q.radius === undefined || q.lat !== undefined, { message: "radius requires lat and lng" }),
});

const getMyPets = z.object({
  query: z.object({
    ...paginationQuery(petSortableFields),
    speciesId: zId.optional(),
    species: z.string().trim().max(60).optional(),
    breed: z.string().trim().max(80).optional(),
    size: z.string().trim().max(30).optional(),
    location: z.string().trim().max(120).optional(),
    status: z.enum(PetStatus).optional(),
  }),
});

const updateStatus = z.object({
  params: idParams("petId"),
  body: z.object({ status: z.enum(MANUAL_STATUSES as [PetStatus, ...PetStatus[]]) }),
});

const petIdParam = z.object({ params: idParams("petId") });

export const petValidation = {
  createPet,
  updatePet,
  getPets,
  getMyPets,
  updateStatus,
  petIdParam,
};
