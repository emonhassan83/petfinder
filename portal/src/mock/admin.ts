//* Mock data for new admin screens. Replaced by real APIs in Phase 3/4.
export type Verification = {
  id: string;
  org: string;
  contact: string;
  type: "Shelter" | "Owner";
  docs: string[];
  submitted: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
};

export const mockVerifications: Verification[] = [
  { id: "v1", org: "Happy Paws Shelter", contact: "hello@happypaws.org", type: "Shelter", docs: ["Registration certificate.pdf", "Facility photo.jpg"], submitted: "1 day ago", status: "PENDING" },
  { id: "v2", org: "Second Chance Rescue", contact: "team@secondchance.org", type: "Shelter", docs: ["NGO license.pdf"], submitted: "3 days ago", status: "PENDING" },
  { id: "v3", org: "Rina Chowdhury", contact: "rina@example.com", type: "Owner", docs: ["National ID.jpg"], submitted: "4 days ago", status: "VERIFIED" },
];

export type Report = {
  id: string;
  targetType: "Listing" | "User";
  target: string;
  reason: string;
  reporter: string;
  date: string;
  status: "OPEN" | "DISMISSED" | "ACTIONED";
};

export const mockReports: Report[] = [
  { id: "r1", targetType: "Listing", target: "Rex (Dog) – listing #482", reason: "Suspected scam: asks for upfront payment", reporter: "Sara Ahmed", date: "Today", status: "OPEN" },
  { id: "r2", targetType: "User", target: "petdeals_99", reason: "Spam messages", reporter: "Tom Reyes", date: "Yesterday", status: "OPEN" },
  { id: "r3", targetType: "Listing", target: "Coco (Cat) – listing #377", reason: "Duplicate listing", reporter: "Mina Das", date: "3 days ago", status: "DISMISSED" },
];

export const mockSubscriptions = [
  { id: "s1", account: "Happy Paws Shelter", plan: "Premium", cycle: "Yearly", status: "ACTIVE", renews: "2027-03-14" },
  { id: "s2", account: "Second Chance Rescue", plan: "Pro", cycle: "Monthly", status: "PAST_DUE", renews: "2026-11-30" },
  { id: "s3", account: "Rina Chowdhury", plan: "Pro", cycle: "Monthly", status: "CANCELED", renews: "–" },
];

export const mockTransactions = [
  { id: "t1", account: "Happy Paws Shelter", amount: 490, currency: "USD", status: "PAID", date: "2026-03-14" },
  { id: "t2", account: "Second Chance Rescue", amount: 19, currency: "USD", status: "FAILED", date: "2026-11-24" },
  { id: "t3", account: "Rina Chowdhury", amount: 19, currency: "USD", status: "PAID", date: "2026-10-02" },
];

export const mockLookups: Record<string, string[]> = {
  Species: ["Dog", "Cat", "Rabbit", "Bird"],
  Breeds: ["Labrador", "Beagle", "Siamese", "Maine Coon"],
  Locations: ["Dhaka", "Chattogram", "Sylhet", "Khulna"],
};

export const mockFaqs = [
  { id: "f1", q: "How does adoption work?", a: "Browse pets, submit an application, chat with the shelter, then arrange a visit." },
  { id: "f2", q: "Is there a fee?", a: "Fees are set by each shelter or owner. PetFinder never charges adopters." },
];

export const mockPages = ["Terms of Service", "Privacy Policy", "Adoption Guidelines"];

export const mockAudit = [
  { id: "x1", actor: "admin@petfinder.test", action: "VERIFY_SHELTER", entity: "ShelterProfile v3", time: "2026-11-26 09:14" },
  { id: "x2", actor: "admin@petfinder.test", action: "HIDE_LISTING", entity: "Pet #377", time: "2026-11-25 17:02" },
  { id: "x3", actor: "root@petfinder.test", action: "CHANGE_ROLE", entity: "User nadia → ADMIN", time: "2026-11-24 11:40" },
];
