//* UI-facing types and mappers from API payloads. Money is kept in minor units until display.
export type Size = "Small" | "Medium" | "Large";
export type Gender = "Male" | "Female" | "Unknown";

export type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: Gender;
  size: string;
  location: string;
  distanceKm?: number;
  shelter: string;
  shelterId: string | null;
  ownerId: string | null;
  verified: boolean;
  image: string;
  photos: string[]; // gallery, first is the cover
  color: string[];
  tint: string; // soft backdrop behind the photo
  about: string;
  requirements: string;
  temperament: string;
  favorited?: boolean;
};

export type Fee = { id: string; label: string; amount: number; note: string | null }; // amount in minor units
export type Fees = { currency: string; total: number; fees: Fee[] };

export type Shelter = { id: string; name: string; verified: boolean; location: string; petsCount: number; logo: string | null; slug: string };

export type Story = {
  id: string;
  petId: string | null;
  petName: string;
  family: string;
  city: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
};

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | "COMPLETED";
export type Application = { id: string; petId: string; petName: string; petImage: string; status: ApplicationStatus; createdAt: string };

export type VisitStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type Visit = {
  id: string;
  petId: string;
  petName: string;
  petImage: string;
  shelter: string;
  status: VisitStatus;
  startsAt: string;
  timezone: string;
};

export type VisitSlot = { id: string | null; startsAt: string; endsAt: string; remaining: number; timezone: string };

export type Conversation = {
  id: string;
  petId: string | null;
  petName: string;
  petImage: string;
  with: string;
  lastText: string;
  lastAt: string;
  unread: number;
};
export type Message = { id: string; conversationId: string; senderId: string; body: string; createdAt: string };

export type AppUser = { id: string; name: string; email: string; role: string; contactNumber?: string; address?: string; profilePhoto?: string | null };
export type AppNotification = { id: string; title: string; body: string; createdAt: string; read: boolean };

const TINTS = ["#F9C9BE", "#CFE3F3", "#CDE8F7", "#FBD3B5", "#D9EED9", "#F4E1C6", "#CFEADF"];
const tintFor = (id: string) => TINTS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];

export const toPet = (p: any): Pet => {
  const media: string[] = (p.media ?? []).filter((m: any) => m.type === "IMAGE").sort((a: any, b: any) => a.order - b.order).map((m: any) => m.url);
  const image: string = p.image || media[0] || "";
  const photos = media.length ? media : image ? [image] : [];
  const owner = p.user;
  return {
    id: p.id,
    name: p.name,
    species: p.species ?? "",
    breed: p.breed ?? "",
    age: p.age ?? 0,
    gender: p.gender ?? "Unknown",
    size: p.size ?? "",
    location: p.location ?? "",
    distanceKm: typeof p.distanceKm === "number" ? Math.round(p.distanceKm * 10) / 10 : undefined,
    shelter: p.shelter?.name ?? owner?.name ?? "Independent owner",
    shelterId: p.shelter?.id ?? p.shelterId ?? null,
    ownerId: owner?.id ?? p.userId ?? null,
    verified: p.shelter?.verificationStatus === "VERIFIED",
    image,
    photos,
    color: Array.isArray(p.colors) && p.colors.length ? p.colors : p.color ? [p.color] : [],
    tint: tintFor(p.id),
    about: p.description ?? "",
    requirements: p.adoptionRequirements ?? "",
    temperament: p.temperament ?? "",
    favorited: p.favorited,
  };
};

export const toShelter = (s: any): Shelter => ({
  id: s.id,
  name: s.name,
  verified: s.verificationStatus === "VERIFIED",
  location: s.location?.city ?? s.location?.name ?? "",
  petsCount: s.petsCount ?? 0,
  logo: s.logo ?? null,
  slug: s.slug,
});

export const toStory = (s: any): Story => ({
  id: s.id,
  petId: s.petId ?? null,
  petName: s.pet?.name ?? "",
  family: s.family ?? s.shelter?.name ?? "",
  city: s.city ?? "",
  title: s.title ?? "",
  excerpt: s.excerpt ?? (s.body ?? "").slice(0, 160),
  body: s.body ?? "",
  image: s.afterImage ?? s.media?.[0]?.url ?? s.beforeImage ?? s.pet?.image ?? "",
});

export const toApplication = (a: any): Application => ({
  id: a.id,
  petId: a.petId,
  petName: a.pet?.name ?? "Pet",
  petImage: a.pet?.image ?? "",
  status: a.status,
  createdAt: a.createdAt,
});

export const toVisit = (v: any): Visit => ({
  id: v.id,
  petId: v.petId,
  petName: v.pet?.name ?? "Pet",
  petImage: v.pet?.image ?? "",
  shelter: v.pet?.shelter?.name ?? "",
  status: v.status,
  startsAt: v.slot?.startsAt,
  timezone: v.slot?.timezone ?? "UTC",
});

export const toConversation = (c: any): Conversation => ({
  id: c.id,
  petId: c.petId ?? c.pet?.id ?? null,
  petName: c.pet?.name ?? "",
  petImage: c.pet?.image ?? "",
  with: c.counterparts?.[0]?.name ?? "Conversation",
  lastText: c.lastMessage?.body ?? "",
  lastAt: c.lastMessageAt ?? c.lastMessage?.createdAt ?? c.createdAt,
  unread: c.unreadCount ?? 0,
});

export const toMessage = (m: any): Message => ({ id: m.id, conversationId: m.conversationId, senderId: m.senderId, body: m.body, createdAt: m.createdAt });
