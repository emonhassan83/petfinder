import { z } from "zod";
import { idParams, zBoolQuery, zId } from "../../../shared/validation";

const petParams = z.object({ params: idParams("petId") });

const addPetMedia = z.object({
  params: idParams("petId"),
  body: z.object({ isCover: zBoolQuery.optional() }),
});

const petMediaItem = z.object({ params: idParams("petId", "mediaId") });

const reorder = z.object({
  params: idParams("petId"),
  body: z.object({ ids: z.array(zId).min(1).max(50) }),
});

export const mediaValidation = { petParams, addPetMedia, petMediaItem, reorder };
