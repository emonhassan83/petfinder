import { AnimalSleep, OpinionOption } from "@prisma/client";

export type IAdoptionRequest = {
  petId: string;
  petOwnershipExperience: string;
  petsHousehold: string;
  petsNeutered: OpinionOption;
  secureOutdoorArea: OpinionOption;
  animalSleep: AnimalSleep;
  animalAlonePeriodsTime: OpinionOption;
  detailsSupport: string;
};
