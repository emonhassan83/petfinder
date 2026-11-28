//* Mock data for shelter/owner dashboard screens. Replaced by real APIs in Phase 3/4.
export type ListingStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ADOPTED";

export type Listing = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  status: ListingStatus;
  views: number;
  applications: number;
};

export const mockListings: Listing[] = [
  { id: "l1", name: "Bella", species: "Dog", breed: "Labrador", age: 3, status: "PUBLISHED", views: 412, applications: 5 },
  { id: "l2", name: "Max", species: "Dog", breed: "Beagle", age: 2, status: "PUBLISHED", views: 268, applications: 2 },
  { id: "l3", name: "Luna", species: "Cat", breed: "Siamese", age: 1, status: "PAUSED", views: 130, applications: 1 },
  { id: "l4", name: "Oscar", species: "Cat", breed: "Maine Coon", age: 4, status: "DRAFT", views: 0, applications: 0 },
];

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export const mockApplications: { id: string; applicant: string; pet: string; submitted: string; note: string; status: ApplicationStatus }[] = [
  { id: "a1", applicant: "Sara Ahmed", pet: "Bella", submitted: "2 days ago", note: "Fenced yard, owned dogs for 10 years.", status: "PENDING" },
  { id: "a2", applicant: "Tom Reyes", pet: "Bella", submitted: "3 days ago", note: "Apartment, works from home.", status: "PENDING" },
  { id: "a3", applicant: "Mina Das", pet: "Max", submitted: "5 days ago", note: "Two kids, first-time owner.", status: "PENDING" },
  { id: "a4", applicant: "Leo Park", pet: "Luna", submitted: "1 week ago", note: "Experienced cat owner.", status: "APPROVED" },
];

export const mockMembers = [
  { id: "m1", name: "You (owner)", email: "you@example.com", role: "Owner" },
  { id: "m2", name: "Nadia Khan", email: "nadia@example.com", role: "Editor" },
];

export const mockMonthly = [
  { month: "2026-06-01", count: 12 },
  { month: "2026-07-01", count: 18 },
  { month: "2026-08-01", count: 15 },
  { month: "2026-09-01", count: 27 },
  { month: "2026-10-01", count: 31 },
  { month: "2026-11-01", count: 24 },
];

export const mockPlans = [
  { id: "free", name: "Free", price: { month: 0, year: 0 }, listings: 3, media: 5, featured: 0, members: 1 },
  { id: "pro", name: "Pro", price: { month: 19, year: 190 }, listings: 25, media: 12, featured: 2, members: 5 },
  { id: "premium", name: "Premium", price: { month: 49, year: 490 }, listings: 100, media: 20, featured: 10, members: 20 },
];

export const mockCurrentPlan = { planId: "free", used: { listings: 4 } };

//* Meet-and-greet visits (Phase 2f / v1.1). Weekly template: open days and slot times; capacity = visitors per slot.
export const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const slotTimes = ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
export const mockWeeklySlots: Record<(typeof weekDays)[number], string[]> = {
  Mon: ["10:00", "11:00", "15:00", "16:00"],
  Tue: ["10:00", "11:00", "15:00", "16:00"],
  Wed: ["14:00", "15:00", "16:00", "17:00"],
  Thu: ["10:00", "11:00", "15:00", "16:00"],
  Fri: [],
  Sat: ["10:00", "11:00", "12:00", "14:00", "15:00"],
  Sun: ["11:00", "12:00", "14:00"],
};

export type ShelterVisitStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export const mockShelterVisits: { id: string; visitor: string; pet: string; date: string; time: string; note?: string; status: ShelterVisitStatus }[] = [
  { id: "v1", visitor: "Farhana K.", pet: "Bella", date: "2026-11-29", time: "11:00", note: "Coming with my two kids (8 and 11).", status: "REQUESTED" },
  { id: "v2", visitor: "Tanvir A.", pet: "Max", date: "2026-11-29", time: "15:00", status: "CONFIRMED" },
  { id: "v3", visitor: "Nusrat J.", pet: "Luna", date: "2026-11-30", time: "12:00", note: "First-time cat owner, happy to learn.", status: "REQUESTED" },
  { id: "v4", visitor: "Arif H.", pet: "Bella", date: "2026-12-02", time: "16:00", status: "CONFIRMED" },
  { id: "v5", visitor: "Sadia R.", pet: "Max", date: "2026-11-22", time: "10:00", status: "COMPLETED" },
  { id: "v6", visitor: "Imran K.", pet: "Bella", date: "2026-11-20", time: "15:00", status: "NO_SHOW" },
];
