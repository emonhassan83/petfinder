import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { MAX_VIDEO_BYTES, assertCloudinaryConfigured } from "./media.service";

//* Memory storage; the absolute cap is the video limit, finer per-type limits are enforced in media.service.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 10 },
});

//* Runs before multer so a missing Cloudinary config answers 503 without buffering the upload.
export const requireCloudinary = (_req: Request, _res: Response, next: NextFunction) => {
  try {
    assertCloudinaryConfigured();
    next();
  } catch (err) {
    next(err);
  }
};
