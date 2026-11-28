//* Helpers that adapt API rows to the shapes the existing cards/pages render.
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "";
export const PLACEHOLDER_PET_IMAGE = "/placeholder-pet.png";

export type ApiMedia = { id: string; type: "IMAGE" | "VIDEO"; url: string; isCover?: boolean; sortOrder?: number };

export type UiPet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  color: string;
  colors: string[];
  location: string;
  image: string;
  photos: string[];
  videos: string[];
  description: string;
  status?: string;
  shelterId?: string | null;
  shelter?: { id: string; name: string; slug?: string; logo?: string | null; verificationStatus?: string } | null;
  user?: { id: string; name: string; profilePhoto?: string | null; role?: string } | null;
  [key: string]: any;
};

//* Cover media first, then the legacy `image` column, then a placeholder
export const normalizePet = (pet: any): UiPet => {
  const media: ApiMedia[] = Array.isArray(pet?.media) ? [...pet.media] : [];
  media.sort((a, b) => Number(!!b.isCover) - Number(!!a.isCover) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const photos = media.filter((m) => m.type !== "VIDEO").map((m) => m.url);
  const videos = media.filter((m) => m.type === "VIDEO").map((m) => m.url);
  if (pet?.image && !photos.includes(pet.image)) photos.push(pet.image);
  const colors: string[] = Array.isArray(pet?.colors) && pet.colors.length ? pet.colors : pet?.color ? [pet.color] : [];
  return {
    ...pet,
    image: photos[0] || pet?.image || PLACEHOLDER_PET_IMAGE,
    photos: photos.length ? photos : [PLACEHOLDER_PET_IMAGE],
    videos,
    colors,
    color: colors.join(" & ") || pet?.color || "",
    location: pet?.location || pet?.shelter?.location?.name || "",
    description: pet?.description || "",
  };
};

//* Money is stored in minor units (cents / poisha)
export const formatMoney = (minor: number, currency = "USD") => {
  const value = (minor || 0) / 100;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

//* Server components: fetch an API envelope; returns null when the API is unreachable or 4xx/5xx
export const fetchApi = async <T = any>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } }
): Promise<{ data: T; meta?: any } | null> => {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, init?.cache ? init : { next: { revalidate: 60 }, ...init });
    if (!res.ok) return null;
    const body = await res.json();
    return { data: body?.data as T, meta: body?.meta };
  } catch {
    return null;
  }
};

export const errorMessage = (err: any, fallback = "Something went wrong") =>
  err?.data?.message || err?.message || fallback;

//* Fetch for client components: data on success, [] / null on HTTP errors, "offline" when unreachable
export const fetchPublic = async <T = any>(path: string): Promise<{ data: T; meta?: any } | "offline" | null> => {
  if (!API_URL) return "offline";
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return null;
    const body = await res.json();
    return { data: body?.data as T, meta: body?.meta };
  } catch {
    return "offline";
  }
};

export type UiStory = {
  id: string;
  petName: string;
  species: string;
  family: string;
  city: string;
  adoptedOn: string;
  shelterId: string;
  shelterName?: string;
  title: string;
  excerpt: string;
  before?: string;
  after?: string;
  image: string;
  body?: string[];
};

//* /success-stories row -> the story card/lookbook shape used by the pages
export const normalizeStory = (s: any): UiStory => {
  const media: string[] = (s?.media ?? []).filter((m: any) => m.type !== "VIDEO").map((m: any) => m.url);
  const body = String(s?.body ?? "");
  return {
    id: s.id,
    petName: s.pet?.name || s.title,
    species: s.species?.name || "",
    family: s.family || "",
    city: s.city || "",
    adoptedOn: s.adoptedOn || s.publishedAt || s.createdAt,
    shelterId: s.shelter?.slug || s.shelter?.id || s.shelterId || "",
    shelterName: s.shelter?.name,
    title: s.title,
    excerpt: s.excerpt || (body.length > 180 ? `${body.slice(0, 180)}…` : body),
    before: s.beforeImage || undefined,
    after: s.afterImage || undefined,
    image: s.afterImage || media[0] || s.beforeImage || PLACEHOLDER_PET_IMAGE,
    body: body.split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean),
  };
};

export type UiShelter = {
  id: string; //* slug when present (used in URLs), else the uuid
  apiId: string;
  name: string;
  type?: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  verified: boolean;
  rating: number;
  reviews: number;
  since?: number;
  image?: string;
  logo?: string;
  about: string;
  petsCount: number;
};

//* /shelters row -> directory/profile shape
export const normalizeShelter = (s: any): UiShelter => ({
  id: s.slug || s.id,
  apiId: s.id,
  name: s.name,
  type: s.type,
  city: s.location?.city || s.location?.name || "",
  address: s.address || undefined,
  phone: s.phone || undefined,
  email: s.email || undefined,
  website: s.website || undefined,
  verified: s.verificationStatus === "VERIFIED",
  rating: Number(s.ratingAvg ?? 0),
  reviews: Number(s.ratingCount ?? 0),
  since: s.createdAt ? new Date(s.createdAt).getFullYear() : undefined,
  image: s.coverImage || s.logo || undefined,
  logo: s.logo || undefined,
  about: s.description || "",
  petsCount: Number(s.petsCount ?? s.pets?.length ?? 0),
});
