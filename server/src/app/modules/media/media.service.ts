import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { MediaType, PetStatus } from "@prisma/client";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { logger } from "../../../shared/logger";
import { assertWithinLimit } from "../../../shared/entitlements";
import { assertPetOwner } from "../../../shared/ownership";
import { IUser } from "../../interfaces";
import ApiError from "../../errors/ApiErrors";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type UploadKind = "IMAGE" | "VIDEO" | "DOCUMENT";
export type UploadProfile = "image" | "media" | "document";

//* Allowed content per profile: image = photos only, media = photos + videos (pets), document = pdf + photos (verification)
const ALLOWED: Record<UploadProfile, UploadKind[]> = {
  image: ["IMAGE"],
  media: ["IMAGE", "VIDEO"],
  document: ["IMAGE", "DOCUMENT"],
};

export const isCloudinaryConfigured = () =>
  Boolean(config.cloudinary.cloud_name && config.cloudinary.api_key && config.cloudinary.api_secret);

//* 503 when CLOUDINARY_* env is missing (never crashes on boot)
export const assertCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Media uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
    secure: true,
  });
};

//* Sniffs the real type from magic bytes so a spoofed Content-Type cannot slip through.
const sniff = (b: Buffer): { mime: string; kind: UploadKind } | null => {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", kind: "IMAGE" };
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", kind: "IMAGE" };
  if (b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP")
    return { mime: "image/webp", kind: "IMAGE" };
  if (b.subarray(4, 8).toString("ascii") === "ftyp") return { mime: "video/mp4", kind: "VIDEO" };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { mime: "video/webm", kind: "VIDEO" };
  if (b.subarray(0, 4).toString("ascii") === "%PDF") return { mime: "application/pdf", kind: "DOCUMENT" };
  return null;
};

export const validateUpload = (file: Express.Multer.File | undefined, profile: UploadProfile) => {
  if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded. Send multipart/form-data with a "file" field.');
  const detected = sniff(file.buffer);
  if (!detected || !ALLOWED[profile].includes(detected.kind)) {
    const allowed =
      profile === "image"
        ? "jpeg, png or webp images"
        : profile === "media"
          ? "jpeg/png/webp images or mp4/webm videos"
          : "pdf or jpeg/png/webp files";
    throw new ApiError(httpStatus.BAD_REQUEST, `Unsupported file type. Allowed: ${allowed}.`);
  }
  const max = detected.kind === "VIDEO" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    throw new ApiError(
      httpStatus.REQUEST_ENTITY_TOO_LARGE,
      `File too large. ${detected.kind === "VIDEO" ? "Videos" : "Images and documents"} may be at most ${max / 1024 / 1024} MB.`
    );
  }
  return { ...detected, size: file.size };
};

const uploadBuffer = (buffer: Buffer, folder: string, resourceType: "image" | "video" | "raw") =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, overwrite: false },
      (err, result) => (err || !result ? reject(err ?? new Error("Upload failed")) : resolve(result))
    );
    stream.end(buffer);
  });

export const uploadValidated = async (
  file: Express.Multer.File,
  detected: { kind: UploadKind; mime: string },
  subfolder: string
) => {
  assertCloudinaryConfigured();
  const resourceType = detected.kind === "VIDEO" ? "video" : detected.kind === "DOCUMENT" ? "raw" : "image";
  try {
    return await uploadBuffer(file.buffer, `${config.cloudinary.folder}/${subfolder}`, resourceType);
  } catch (err) {
    logger.error("cloudinary upload failed", err);
    throw new ApiError(httpStatus.BAD_GATEWAY, "Could not store the file. Please try again.");
  }
};

const resourceTypeFromUrl = (url: string): "image" | "video" | "raw" => {
  const m = url.match(/\/(image|video|raw)\/(?:upload|authenticated|private)\//);
  return (m?.[1] as "image" | "video" | "raw") ?? "image";
};

//* Best-effort removal from Cloudinary; failures are logged, never thrown.
export const deleteAsset = async (
  publicId: string | null | undefined,
  url: string,
  resourceType?: "image" | "video" | "raw"
) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    assertCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType ?? resourceTypeFromUrl(url),
      invalidate: true,
    });
  } catch (err) {
    logger.error("cloudinary delete failed", err);
  }
};

//* Generic image upload for avatars, logos, covers, story photos. Folder is per user.
const uploadGeneric = async (user: IUser, file: Express.Multer.File | undefined) => {
  const detected = validateUpload(file, "image");
  const r = await uploadValidated(file!, detected, `uploads/${user.id}`);
  return {
    url: r.secure_url,
    publicId: r.public_id,
    width: r.width,
    height: r.height,
    mimeType: detected.mime,
    size: detected.size,
  };
};

const fullPetMedia = (petId: string) =>
  prisma.petMedia.findMany({ where: { petId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

const addPetMedia = async (user: IUser, petId: string, file: Express.Multer.File | undefined, wantsCover: boolean) => {
  const pet = await assertPetOwner(user.id, user.role, petId);
  if (pet.status === PetStatus.REMOVED) throw new ApiError(httpStatus.BAD_REQUEST, "Cannot add media to a removed listing");
  const detected = validateUpload(file, "media");
  if (detected.kind === "DOCUMENT") throw new ApiError(httpStatus.BAD_REQUEST, "Documents cannot be attached to a listing");
  await assertWithinLimit(user.id, "media", { petId, role: user.role });

  const r = await uploadValidated(file!, detected, `pets/${petId}`);
  try {
    return await prisma.$transaction(async (tx) => {
      //* Re-check inside the transaction so concurrent uploads cannot exceed the limit
      await assertWithinLimit(user.id, "media", { petId, role: user.role, tx });
      const last = await tx.petMedia.aggregate({ where: { petId }, _max: { order: true } });
      const hasCover = await tx.petMedia.count({ where: { petId, isCover: true } });
      const type = detected.kind === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE;
      const makeCover = type === MediaType.IMAGE && (wantsCover || hasCover === 0);
      if (makeCover) await tx.petMedia.updateMany({ where: { petId, isCover: true }, data: { isCover: false } });
      const media = await tx.petMedia.create({
        data: {
          petId,
          type,
          url: r.secure_url,
          publicId: r.public_id,
          width: r.width ?? null,
          height: r.height ?? null,
          duration: typeof r.duration === "number" ? r.duration : null,
          order: (last._max.order ?? -1) + 1,
          isCover: makeCover,
        },
      });
      if (makeCover) await tx.pet.update({ where: { id: petId }, data: { image: media.url } });
      return media;
    });
  } catch (err) {
    await deleteAsset(r.public_id, r.secure_url, detected.kind === "VIDEO" ? "video" : "image");
    throw err;
  }
};

const deletePetMedia = async (user: IUser, petId: string, mediaId: string) => {
  await assertPetOwner(user.id, user.role, petId);
  const media = await prisma.petMedia.findFirst({ where: { id: mediaId, petId } });
  if (!media) throw new ApiError(httpStatus.NOT_FOUND, "Media not found");

  await prisma.$transaction(async (tx) => {
    await tx.petMedia.delete({ where: { id: mediaId } });
    if (media.isCover) {
      const next = await tx.petMedia.findFirst({ where: { petId, type: MediaType.IMAGE }, orderBy: { order: "asc" } });
      if (next) await tx.petMedia.update({ where: { id: next.id }, data: { isCover: true } });
      await tx.pet.update({ where: { id: petId }, data: { image: next?.url ?? "" } });
    }
  });
  await deleteAsset(media.publicId, media.url, media.type === MediaType.VIDEO ? "video" : "image");
  return fullPetMedia(petId);
};

const setCover = async (user: IUser, petId: string, mediaId: string) => {
  await assertPetOwner(user.id, user.role, petId);
  const media = await prisma.petMedia.findFirst({ where: { id: mediaId, petId } });
  if (!media) throw new ApiError(httpStatus.NOT_FOUND, "Media not found");
  if (media.type !== MediaType.IMAGE) throw new ApiError(httpStatus.BAD_REQUEST, "Only images can be the cover");
  await prisma.$transaction([
    prisma.petMedia.updateMany({ where: { petId, isCover: true }, data: { isCover: false } }),
    prisma.petMedia.update({ where: { id: mediaId }, data: { isCover: true } }),
    prisma.pet.update({ where: { id: petId }, data: { image: media.url } }),
  ]);
  return fullPetMedia(petId);
};

//* `ids` must be exactly the pet's media ids; order becomes the array order.
const reorderPetMedia = async (user: IUser, petId: string, ids: string[]) => {
  await assertPetOwner(user.id, user.role, petId);
  const existing = await prisma.petMedia.findMany({ where: { petId }, select: { id: true } });
  const set = new Set(existing.map((m) => m.id));
  if (ids.length !== set.size || new Set(ids).size !== ids.length || !ids.every((id) => set.has(id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "ids must list every media item of this pet exactly once");
  }
  await prisma.$transaction(ids.map((id, order) => prisma.petMedia.update({ where: { id }, data: { order } })));
  return fullPetMedia(petId);
};

export const MediaService = { uploadGeneric, addPetMedia, deletePetMedia, setCover, reorderPetMedia };
