import { del, get, patch, post, put, saveTokens, clearTokens, getRefreshToken } from "./client";
import {
  AppNotification, AppUser, Application, Conversation, Fees, Message, Pet, Shelter, Story, Visit, VisitSlot,
  toApplication, toConversation, toMessage, toPet, toShelter, toStory, toVisit,
} from "./types";

export type Page<T> = { items: T[]; total: number; page: number; limit: number };
const page = <T,>(data: any[], meta: any, map: (x: any) => T): Page<T> => ({
  items: (data ?? []).map(map),
  total: meta?.total ?? data?.length ?? 0,
  page: meta?.page ?? 1,
  limit: meta?.limit ?? data?.length ?? 0,
});

//* Auth
export const login = async (email: string, password: string) => {
  const { data } = await post<{ accessToken: string; refreshToken: string }>("/auth/login", { email, password }, false);
  await saveTokens(data.accessToken, data.refreshToken);
};
export const register = async (input: { name: string; email: string; password: string; contactNumber: string; address: string; role: "USER" | "OWNER" }) => {
  await post("/user/register", input, false);
  await login(input.email, input.password);
};
export const logout = async () => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await post("/auth/logout", { refreshToken }, false);
  } catch {}
  await clearTokens();
};
export const fetchProfile = async (): Promise<AppUser> => (await get<AppUser>("/user/profile")).data;

//* Pets and discovery
export type PetFilters = { species?: string; gender?: string; colors?: string[]; searchTerm?: string; lat?: number; lng?: number; radius?: number; page?: number; limit?: number };
export const fetchPets = async (f: PetFilters = {}): Promise<Page<Pet>> => {
  const { data, meta } = await get<any[]>("/pets", { ...f, colors: f.colors?.length ? f.colors.join(",").toLowerCase() : undefined, limit: f.limit ?? 20 }, false);
  return page(data, meta, toPet);
};
export const fetchPet = async (id: string): Promise<Pet> => toPet((await get<any>(`/pets/${id}`)).data);
export const fetchFees = async (petId: string): Promise<Fees> => {
  const { data } = await get<any>(`/pets/${petId}/fees`, undefined, false);
  return { currency: data.currency, total: data.total, fees: data.fees ?? [] };
};
export const fetchShelters = async (): Promise<Shelter[]> => {
  const { data } = await get<any[]>("/shelters", { limit: 10 }, false);
  return data.map(toShelter);
};
export const fetchStories = async (): Promise<Story[]> => {
  const { data } = await get<any[]>("/success-stories", { limit: 20 }, false);
  return data.map(toStory);
};
export const fetchCostEstimates = async (): Promise<any | null> => {
  try {
    const { data } = await get<Record<string, any>>("/settings/public", undefined, false);
    return data?.["cost.estimates"] ?? null;
  } catch {
    return null;
  }
};

//* Favorites
export const fetchFavoriteIds = async (): Promise<string[]> => (await get<string[]>("/favorites/ids")).data;
export const fetchFavorites = async (): Promise<Pet[]> => (await get<any[]>("/favorites", { limit: 50 })).data.map(toPet);
export const addFavorite = (petId: string) => put(`/favorites/${petId}`);
export const removeFavorite = (petId: string) => del(`/favorites/${petId}`);

//* Applications
export type AdoptionAnswers = {
  petsHousehold: string;
  petsNeutered: "YES" | "NO";
  secureOutdoorArea: "YES" | "NO";
  animalSleep: "Outdoor" | "Indoor" | "Room" | "Garage" | "Crate";
  animalAlonePeriodsTime: "YES" | "NO";
  detailsSupport: string;
  petOwnershipExperience: string;
};
export const applyToAdopt = (petId: string, answers: AdoptionAnswers) => post("/adoption-requests", { petId, ...answers });
export const fetchApplications = async (): Promise<Application[]> => (await get<any[]>("/adoption-requests/my-adoption", { limit: 50 })).data.map(toApplication);
export const withdrawApplication = (id: string) => patch(`/adoption-requests/${id}/withdraw`);

//* Visits
export const fetchVisitSlots = async (petId: string): Promise<{ timezone: string; slots: VisitSlot[] }> => {
  const { data } = await get<{ timezone: string; slots: VisitSlot[] }>(`/pets/${petId}/visit-slots`, undefined, false);
  return { timezone: data.timezone, slots: data.slots ?? [] };
};
export const bookVisit = async (petId: string, slot: VisitSlot, note?: string): Promise<Visit> =>
  toVisit((await post<any>("/visits", { petId, ...(slot.id ? { slotId: slot.id } : { startsAt: slot.startsAt }), ...(note ? { note } : {}) })).data);
export const fetchVisits = async (): Promise<Visit[]> => (await get<any[]>("/visits/me", { limit: 50 })).data.map(toVisit);
export const cancelVisit = (id: string) => patch(`/visits/${id}`, { action: "cancel" });

//* Reports and chat
export const reportPet = (petId: string, reason: string, details?: string) =>
  post("/reports", { targetType: "PET", targetId: petId, reason, ...(details ? { details } : {}) });
export const startConversation = async (petId: string): Promise<string> => (await post<{ id: string }>("/conversations", { petId })).data.id;
export const fetchConversations = async (): Promise<Conversation[]> => (await get<any[]>("/conversations", { limit: 50 })).data.map(toConversation);
export const fetchMessages = async (conversationId: string, cursor?: string | null) => {
  const { data, meta } = await get<any[]>(`/conversations/${conversationId}/messages`, { limit: 30, cursor });
  return { messages: data.map(toMessage), nextCursor: (meta?.nextCursor as string | null) ?? null };
};
export const sendMessage = async (conversationId: string, body: string): Promise<Message> => toMessage((await post<any>(`/conversations/${conversationId}/messages`, { body })).data);
export const markConversationRead = (conversationId: string) => patch(`/conversations/${conversationId}/read`);
export const fetchConversation = async (id: string): Promise<Conversation> => toConversation((await get<any>(`/conversations/${id}`)).data);

//* Notifications
export const fetchNotifications = async (): Promise<AppNotification[]> =>
  (await get<any[]>("/notifications", { limit: 20 })).data.map((n) => ({ id: n.id, title: n.title, body: n.body, createdAt: n.createdAt, read: !!n.readAt }));
export const registerPushToken = (token: string, platform: "ANDROID" | "IOS") => post("/notifications/push-token", { token, platform });
