import { ReportStatus, ReportTargetType } from "@prisma/client";
import { z } from "zod";
import { idParams, paginationQuery, zId } from "../../../shared/validation";

export const REPORT_ACTIONS = ["WARN", "HIDE_LISTING", "SUSPEND_USER", "HIDE_REVIEW"] as const;

const create = z.object({
  body: z.object({
    targetType: z.enum(ReportTargetType),
    targetId: zId,
    reason: z.string({ error: "Reason is required" }).trim().min(3).max(200),
    details: z.string().trim().max(2000).optional(),
  }),
});

const list = z.object({
  query: z.object({
    ...paginationQuery(["createdAt", "updatedAt"]),
    status: z.enum(ReportStatus).optional(),
    targetType: z.enum(ReportTargetType).optional(),
  }),
});

//* DISMISSED needs no action; ACTIONED needs one of REPORT_ACTIONS. A note is always required.
const resolve = z.object({
  params: idParams("reportId"),
  body: z
    .object({
      status: z.enum([ReportStatus.DISMISSED, ReportStatus.ACTIONED]),
      action: z.enum(REPORT_ACTIONS).optional(),
      note: z.string({ error: "A resolution note is required" }).trim().min(3).max(1000),
    })
    .refine((b) => b.status === ReportStatus.DISMISSED || !!b.action, {
      message: "An action is required when actioning a report",
      path: ["action"],
    }),
});

export const reportSchema = { create, list, resolve };
