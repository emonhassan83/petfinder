import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { cmsService } from "./cms.service";

const actor = (req: Request) => ({ user: req.user!, ip: req.ip });
const reply = (res: Response, message: string, data: unknown, statusCode: number = httpStatus.OK) =>
  sendResponse(res, { statusCode, success: true, message, data: data as any });

export const cmsController = {
  listPublicFaqs: catchAsync(async (req, res) =>
    reply(res, "FAQs fetched", await cmsService.listPublicFaqs((req.query as any).category))
  ),
  listAdminFaqs: catchAsync(async (req, res) => reply(res, "FAQs fetched", await cmsService.listAdminFaqs(req.query as any))),
  createFaq: catchAsync(async (req, res) =>
    reply(res, "FAQ created", await cmsService.createFaq(actor(req), req.body), httpStatus.CREATED)
  ),
  updateFaq: catchAsync(async (req, res) =>
    reply(res, "FAQ updated", await cmsService.updateFaq(actor(req), req.params.id, req.body))
  ),
  deleteFaq: catchAsync(async (req, res) => reply(res, "FAQ deleted", await cmsService.deleteFaq(actor(req), req.params.id))),
  reorderFaqs: catchAsync(async (req, res) =>
    reply(res, "FAQs reordered", await cmsService.reorderFaqs(actor(req), req.body.ids))
  ),

  getPublicPage: catchAsync(async (req, res) => reply(res, "Page fetched", await cmsService.getPublicPage(req.params.slug))),
  listAdminPages: catchAsync(async (req, res) => {
    const result = await cmsService.listAdminPages(req.query);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pages fetched", meta: result.meta, data: result.data });
  }),
  getAdminPage: catchAsync(async (req, res) => reply(res, "Page fetched", await cmsService.getAdminPage(req.params.id))),
  createPage: catchAsync(async (req, res) =>
    reply(res, "Page created", await cmsService.createPage(actor(req), req.body), httpStatus.CREATED)
  ),
  updatePage: catchAsync(async (req, res) =>
    reply(res, "Page updated", await cmsService.updatePage(actor(req), req.params.id, req.body))
  ),
  deletePage: catchAsync(async (req, res) => reply(res, "Page deleted", await cmsService.deletePage(actor(req), req.params.id))),
};
