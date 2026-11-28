//* Preview data for success stories and testimonials (Phase 3f replaces this with /success-stories).
import { unsplash } from "./pets";

export type SuccessStory = {
  id: string;
  petName: string;
  species: "Dog" | "Cat" | "Rabbit";
  family: string;
  city: string;
  adoptedOn: string; // ISO date
  shelterId: string;
  title: string;
  excerpt: string;
  //* Optional pair for the before/after slider
  before?: string;
  after?: string;
  image: string;
  //* Full story paragraphs for /stories/[id]
  body?: string[];
};

export const successStories: SuccessStory[] = [
  {
    id: "s1",
    petName: "Bella",
    species: "Dog",
    family: "The Rahman family",
    city: "Dhaka",
    adoptedOn: "2026-08-14",
    shelterId: "happy-paws",
    title: "From the street corner to the family sofa",
    excerpt: "Bella was found near a tea stall, thin and wary. Three months later she runs the garden every morning and sleeps at the foot of the kids' bed.",
    before: unsplash("1477884213360-7e9d7dcc1e48", 1000),
    after: unsplash("1534361960057-19889db9621e", 1000),
    image: unsplash("1534361960057-19889db9621e"),
  },
  {
    id: "s2",
    petName: "Tiger & Lulu",
    species: "Cat",
    family: "Nadia and Arif",
    city: "Chattogram",
    adoptedOn: "2026-06-02",
    shelterId: "second-chance",
    title: "A bonded pair who would not be split up",
    excerpt: "We came for one kitten and left with two. They groom each other every evening and have taken over the window seat.",
    image: unsplash("1450778869180-41d0601e046e"),
  },
  {
    id: "s3",
    petName: "Bruno",
    species: "Dog",
    family: "Mr. and Mrs. Hossain",
    city: "Rajshahi",
    adoptedOn: "2026-09-20",
    shelterId: "bunny-haven",
    title: "A senior pug for a quiet retirement",
    excerpt: "Bruno sets the pace on our evening walks, which suits us perfectly. The shelter matched us better than we could have ourselves.",
    image: unsplash("1517849845537-4d257902454a"),
  },
  {
    id: "s4",
    petName: "Snow",
    species: "Rabbit",
    family: "Ishrat and her daughters",
    city: "Khulna",
    adoptedOn: "2026-07-11",
    shelterId: "bunny-haven",
    title: "A quiet rabbit for a busy flat",
    excerpt: "The girls read up on rabbit care for a month before we applied. Snow now has her own corner, a hay rack and two very devoted carers.",
    image: unsplash("1585110396000-c9ffd4e4b308"),
  },
  {
    id: "s5",
    petName: "Koda",
    species: "Dog",
    family: "Rafi",
    city: "Dhaka",
    adoptedOn: "2026-05-03",
    shelterId: "second-chance",
    title: "An energetic husky meets a weekend hiker",
    excerpt: "The shelter was honest that Koda needs a lot of exercise. That was exactly what I was looking for. We are out every morning before work.",
    image: unsplash("1568572933382-74d440642117"),
  },
  {
    id: "s6",
    petName: "Milo",
    species: "Cat",
    family: "Farhana and Sami",
    city: "Dhaka",
    adoptedOn: "2026-10-09",
    shelterId: "happy-paws",
    title: "The cat who follows you from room to room",
    excerpt: "We booked a visit, met Milo for twenty minutes and knew. He settled in within a week and supervises every meal.",
    image: unsplash("1514888286974-6c03e2ca1dba"),
  },
];

//* Generic paragraphs used when a story has no body yet (preview only)
export const storyBody = (s: SuccessStory) =>
  s.body ?? [
    s.excerpt,
    `${s.family} first saw ${s.petName} on Petfinder, saved the listing and messaged the shelter with questions about routine, health and temperament. After a meet-and-greet they sent their application the same week.`,
    `The first days were about patience: a quiet space, a steady routine and short introductions to the rest of the household. The shelter checked in after the first week and again after a month.`,
    `"If you are thinking about adopting, meet the pet first and ask everything," they told us. "The right match is worth the wait."`,
  ];

export const findStory = (id: string) => successStories.find((s) => s.id === id);

export const testimonials = [
  { name: "Farhana K.", city: "Dhaka", role: "Adopted Milo", quote: "The visit booking made it easy. We met Milo on a Saturday, and the shelter answered every question before we applied." },
  { name: "Tanvir A.", city: "Sylhet", role: "Adopted Pepper", quote: "Seeing the full fee breakdown up front meant no surprises. Pepper came vaccinated, microchipped and ready for home." },
  { name: "Happy Paws Shelter", city: "Dhaka", role: "Verified shelter", quote: "Applications arrive complete, and the chat keeps everything in one place. We rehome faster than we did with social media posts." },
];

//* Wide lifestyle photo with "what every pet gets" hotspots (x/y in % of the image)
export const lifestyleImage = unsplash("1548199973-03cce0bbc87b", 1600);
export const lifestyleHotspots = [
  { x: 33, y: 42, title: "Vet-checked", text: "Every pet sees a vet before listing, with health notes on the profile." },
  { x: 24, y: 72, title: "Vaccinated", text: "Core vaccines are up to date, or the schedule is listed clearly." },
  { x: 66, y: 34, title: "Behaviour assessed", text: "Shelters note how each pet does with children, dogs and cats." },
  { x: 72, y: 70, title: "Microchipped", text: "Where available, pets are chipped and registered to you after adoption." },
];

export const rehomeHeroImage = unsplash("1477884213360-7e9d7dcc1e48", 1000);

//* Story submissions from shelters (moderation flow: DRAFT → PENDING → PUBLISHED | REJECTED). Shared by shelter and admin screens.
export type StoryStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
export type StorySubmission = { id: string; petName: string; shelter: string; title: string; excerpt: string; image: string; submitted: string; status: StoryStatus; note?: string };

export const storySubmissions: StorySubmission[] = [
  { id: "ss1", petName: "Max", shelter: "Happy Paws Shelter", title: "Max finds his running partner", excerpt: "Max went home with a marathon runner who wanted company on early jogs. Two months on, they log 30 km a week together.", image: unsplash("1543466835-00a7907e9de1"), submitted: "2026-11-25", status: "PENDING" },
  { id: "ss2", petName: "Luna", shelter: "Happy Paws Shelter", title: "Luna and the window seat", excerpt: "Luna was the shyest cat in our cattery. Her new family gave her a quiet room and a window seat, and now she greets guests at the door.", image: unsplash("1592194996308-7b43878e84a6"), submitted: "2026-11-24", status: "PENDING" },
  { id: "ss3", petName: "Bella", shelter: "Happy Paws Shelter", title: "From the street corner to the family sofa", excerpt: "Bella was found near a tea stall, thin and wary.", image: unsplash("1534361960057-19889db9621e"), submitted: "2026-08-20", status: "PUBLISHED" },
  { id: "ss4", petName: "Pepper", shelter: "Second Chance Rescue", title: "Pepper's new garden", excerpt: "Pepper now has a garden to patrol.", image: unsplash("1561037404-61cd46aa615b"), submitted: "2026-11-10", status: "REJECTED", note: "Please add the adopter's consent to share their photo." },
];
