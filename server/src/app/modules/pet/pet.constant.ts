import { PetStatus } from "@prisma/client";

export const petSearchAbleFields: string[] = ["name", "species", "breed", "size", "location", "description"]; //* only for search term

export const petSortableFields: [string, ...string[]] = ["createdAt", "updatedAt", "name", "age", "views"];

//* Statuses a lister may move a pet to by hand (PENDING is set by the adoption flow only)
export const MANUAL_STATUSES: PetStatus[] = [
  PetStatus.DRAFT,
  PetStatus.PUBLISHED,
  PetStatus.PAUSED,
  PetStatus.ADOPTED,
  PetStatus.REMOVED,
];

//* Allowed manual transitions for non-admins. Admins may set any manual status.
export const STATUS_TRANSITIONS: Record<PetStatus, PetStatus[]> = {
  DRAFT: [PetStatus.PUBLISHED, PetStatus.REMOVED],
  PUBLISHED: [PetStatus.DRAFT, PetStatus.PAUSED, PetStatus.ADOPTED, PetStatus.REMOVED],
  PAUSED: [PetStatus.DRAFT, PetStatus.PUBLISHED, PetStatus.ADOPTED, PetStatus.REMOVED],
  PENDING: [PetStatus.PUBLISHED, PetStatus.ADOPTED],
  ADOPTED: [],
  REMOVED: [],
};
