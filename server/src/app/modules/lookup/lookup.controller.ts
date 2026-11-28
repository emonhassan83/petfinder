import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { isAdminRole } from "../../../shared/roles";
import { lookupService } from "./lookup.service";

const actor = (req: Request) => ({ user: req.user!, ip: req.ip });
const reply = (res: Response, message: string, data: unknown, statusCode: number = httpStatus.OK) =>
  sendResponse(res, { statusCode, success: true, message, data: data as any });

//* includeInactive is honoured only for admins (public callers always get active rows)
const wantsInactive = (req: Request) => isAdminRole(req.user?.role) && Boolean((req.query as any).includeInactive);

export const lookupController = {
  listSpecies: catchAsync(async (req, res) =>
    reply(res, "Species fetched", await lookupService.listSpecies(wantsInactive(req)))
  ),
  createSpecies: catchAsync(async (req, res) =>
    reply(res, "Species created", await lookupService.createSpecies(actor(req), req.body), httpStatus.CREATED)
  ),
  updateSpecies: catchAsync(async (req, res) =>
    reply(res, "Species updated", await lookupService.updateSpecies(actor(req), req.params.id, req.body))
  ),
  deleteSpecies: catchAsync(async (req, res) =>
    reply(res, "Species deleted", await lookupService.deleteSpecies(actor(req), req.params.id))
  ),

  listBreeds: catchAsync(async (req, res) =>
    reply(
      res,
      "Breeds fetched",
      await lookupService.listBreeds({ speciesId: (req.query as any).speciesId, includeInactive: wantsInactive(req) })
    )
  ),
  createBreed: catchAsync(async (req, res) =>
    reply(res, "Breed created", await lookupService.createBreed(actor(req), req.body), httpStatus.CREATED)
  ),
  updateBreed: catchAsync(async (req, res) =>
    reply(res, "Breed updated", await lookupService.updateBreed(actor(req), req.params.id, req.body))
  ),
  deleteBreed: catchAsync(async (req, res) =>
    reply(res, "Breed deleted", await lookupService.deleteBreed(actor(req), req.params.id))
  ),

  listLocations: catchAsync(async (req, res) =>
    reply(res, "Locations fetched", await lookupService.listLocations(wantsInactive(req)))
  ),
  createLocation: catchAsync(async (req, res) =>
    reply(res, "Location created", await lookupService.createLocation(actor(req), req.body), httpStatus.CREATED)
  ),
  updateLocation: catchAsync(async (req, res) =>
    reply(res, "Location updated", await lookupService.updateLocation(actor(req), req.params.id, req.body))
  ),
  deleteLocation: catchAsync(async (req, res) =>
    reply(res, "Location deleted", await lookupService.deleteLocation(actor(req), req.params.id))
  ),
};
