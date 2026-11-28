import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ShelterService } from "./shelter.service";

const ok = (res: any, message: string, data: unknown, statusCode: number = httpStatus.OK, meta?: any) =>
  sendResponse(res, { statusCode, success: true, message, data: data as any, meta });

const create = catchAsync(async (req, res) => {
  ok(res, "Shelter profile created", await ShelterService.createShelter(req.user!, req.body), httpStatus.CREATED);
});
const getMine = catchAsync(async (req, res) => ok(res, "Shelter profile retrieved", await ShelterService.getMine(req.user!)));
const updateMine = catchAsync(async (req, res) =>
  ok(res, "Shelter profile updated", await ShelterService.updateMine(req.user!, req.body))
);
const addDocument = catchAsync(async (req, res) =>
  ok(res, "Document uploaded", await ShelterService.addDocument(req.user!, req.file, req.body.name), httpStatus.CREATED)
);
const deleteDocument = catchAsync(async (req, res) =>
  ok(res, "Document deleted", await ShelterService.deleteDocument(req.user!, req.params.docId))
);

const listMembers = catchAsync(async (req, res) => ok(res, "Members retrieved", await ShelterService.listMembers(req.user!)));
const addMember = catchAsync(async (req, res) =>
  ok(res, "Member added", await ShelterService.addMember(req.user!, req.body), httpStatus.CREATED)
);
const updateMember = catchAsync(async (req, res) =>
  ok(res, "Member updated", await ShelterService.updateMember(req.user!, req.params.memberId, req.body.role))
);
const removeMember = catchAsync(async (req, res) =>
  ok(res, "Member removed", await ShelterService.removeMember(req.user!, req.params.memberId))
);

const list = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder, ...filters } = req.query as Record<string, any>;
  const result = await ShelterService.listShelters(filters, { page, limit, sortBy, sortOrder }, req.user);
  ok(res, "Shelters retrieved", result.data, httpStatus.OK, result.meta);
});
const getOne = catchAsync(async (req, res) =>
  ok(res, "Shelter retrieved", await ShelterService.getShelter(req.params.id, (req.query as any).petLimit, req.user))
);
const verify = catchAsync(async (req, res) =>
  ok(res, "Shelter verification updated", await ShelterService.updateVerification(req.user!, req.params.id, req.body))
);

export const shelterController = {
  create,
  getMine,
  updateMine,
  addDocument,
  deleteDocument,
  listMembers,
  addMember,
  updateMember,
  removeMember,
  list,
  getOne,
  verify,
};
