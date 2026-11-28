import { z } from "zod";
import { idParams, paginationQuery } from "../../../shared/validation";

const list = z.object({ query: z.object({ ...paginationQuery(["createdAt"]) }) });
const petParam = z.object({ params: idParams("petId") });

export const favoriteValidation = { list, petParam };
