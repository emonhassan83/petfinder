//* Mock data until the API exists (Phase 3/4).
export type Size = "Small" | "Medium" | "Large";
export type Fee = { label: string; amount: number }; // amount in BDT
export type Pet = {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Rabbit";
  breed: string;
  age: number;
  gender: "Male" | "Female";
  size: Size;
  location: string;
  distanceKm: number;
  shelter: string;
  shelterId: string;
  verified: boolean;
  image: string;
  photos: string[]; // gallery, first is the cover
  color: string[]; // coat colour(s)
  fees: Fee[];
  tint: string; // soft backdrop behind the photo
  about: string;
  requirements: string;
};

const img = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const shelters = [
  { id: "s1", name: "Happy Paws Shelter", distanceKm: 3.2, verified: true, tint: "#FFEDE9", icon: "home" as const },
  { id: "s2", name: "Second Chance Rescue", distanceKm: 5.8, verified: true, tint: "#FFF5DA", icon: "heart" as const },
  { id: "s3", name: "Rina (owner)", distanceKm: 1.4, verified: false, tint: "#E8F3FD", icon: "person" as const },
];

export const pets: Pet[] = [
  { id: "p1", name: "Lola", species: "Dog", breed: "Jack Russell", age: 1, gender: "Female", size: "Small", location: "Dhanmondi, Dhaka", distanceKm: 3.2, shelter: "Happy Paws Shelter", shelterId: "s1", verified: true, image: img("1561037404-61cd46aa615b"), photos: [img("1561037404-61cd46aa615b"), img("1537151625747-768eb6cf92b2"), img("1543466835-00a7907e9de1")], color: ["White","Tan"], fees: [{ label: "Adoption fee", amount: 3000 }, { label: "Vaccination", amount: 1500 }, { label: "Microchip", amount: 800 }], tint: "#F9C9BE", about: "Cheerful, playful and friendly, this is Lola. She needs a new home because her former owners moved abroad and could not take her along. She loves fetch, cuddles on the sofa and meeting new people.", requirements: "Daily walks. Home visit before adoption." },
  { id: "p2", name: "Max", species: "Dog", breed: "Beagle", age: 2, gender: "Male", size: "Medium", location: "Agrabad, Chattogram", distanceKm: 1.4, shelter: "Rina (owner)", shelterId: "s3", verified: false, image: img("1543466835-00a7907e9de1"), photos: [img("1543466835-00a7907e9de1"), img("1561037404-61cd46aa615b"), img("1611003228941-98852ba62227")], color: ["Tricolor"], fees: [{ label: "Adoption fee", amount: 2500 }, { label: "Vaccination", amount: 1500 }, { label: "Microchip", amount: 800 }], tint: "#CFE3F3", about: "Energetic and curious. Fully vaccinated and microchipped. Max follows his nose everywhere and would love an active family.", requirements: "Experienced owner preferred." },
  { id: "p3", name: "Luna", species: "Cat", breed: "Tabby", age: 1, gender: "Female", size: "Small", location: "Gulshan, Dhaka", distanceKm: 3.2, shelter: "Happy Paws Shelter", shelterId: "s1", verified: true, image: img("1574158622682-e40e69881006"), photos: [img("1574158622682-e40e69881006"), img("1514888286974-6c03e2ca1dba"), img("1585110396000-c9ffd4e4b308")], color: ["Brown","Black"], fees: [{ label: "Adoption fee", amount: 2000 }, { label: "Vaccination", amount: 1200 }, { label: "Microchip", amount: 800 }], tint: "#CDE8F7", about: "Calm lap cat who loves window watching and soft blankets. Litter trained and gentle with children.", requirements: "Indoor home only." },
  { id: "p4", name: "Yuri", species: "Dog", breed: "Corgi", age: 1, gender: "Male", size: "Small", location: "Zindabazar, Sylhet", distanceKm: 5.8, shelter: "Second Chance Rescue", shelterId: "s2", verified: true, image: img("1537151625747-768eb6cf92b2"), photos: [img("1537151625747-768eb6cf92b2"), img("1561037404-61cd46aa615b"), img("1611003228941-98852ba62227")], color: ["Fawn","White"], fees: [{ label: "Adoption fee", amount: 3500 }, { label: "Vaccination", amount: 1500 }, { label: "Microchip", amount: 800 }], tint: "#FBD3B5", about: "A bundle of joy with short legs and a big heart. Yuri is house-trained and knows sit, paw and down.", requirements: "No long hours alone." },
  { id: "p5", name: "Snow", species: "Rabbit", breed: "Holland Lop", age: 1, gender: "Female", size: "Small", location: "Sonadanga, Khulna", distanceKm: 5.8, shelter: "Second Chance Rescue", shelterId: "s2", verified: true, image: img("1585110396000-c9ffd4e4b308"), photos: [img("1585110396000-c9ffd4e4b308"), img("1574158622682-e40e69881006"), img("1514888286974-6c03e2ca1dba")], color: ["White"], fees: [{ label: "Adoption fee", amount: 1500 }, { label: "Vaccination", amount: 600 }, { label: "Microchip", amount: 0 }], tint: "#D9EED9", about: "Quiet and cuddly. Eats hay and fresh greens and loves gentle strokes behind the ears.", requirements: "Spacious indoor enclosure." },
  { id: "p6", name: "Mochi", species: "Dog", breed: "Golden Retriever", age: 1, gender: "Female", size: "Large", location: "Uttara, Dhaka", distanceKm: 3.2, shelter: "Happy Paws Shelter", shelterId: "s1", verified: true, image: img("1611003228941-98852ba62227"), photos: [img("1611003228941-98852ba62227"), img("1543466835-00a7907e9de1"), img("1537151625747-768eb6cf92b2")], color: ["Golden"], fees: [{ label: "Adoption fee", amount: 4000 }, { label: "Vaccination", amount: 1800 }, { label: "Microchip", amount: 800 }], tint: "#F4E1C6", about: "A sweet, soft puppy who will grow into a loyal, gentle giant. Great with kids and other dogs.", requirements: "Garden or nearby park." },
  { id: "p7", name: "Milo", species: "Cat", breed: "Domestic Shorthair", age: 2, gender: "Male", size: "Medium", location: "Mirpur, Dhaka", distanceKm: 1.4, shelter: "Rina (owner)", shelterId: "s3", verified: false, image: img("1514888286974-6c03e2ca1dba"), photos: [img("1514888286974-6c03e2ca1dba"), img("1574158622682-e40e69881006"), img("1585110396000-c9ffd4e4b308")], color: ["Grey","White"], fees: [{ label: "Adoption fee", amount: 2000 }, { label: "Vaccination", amount: 1200 }, { label: "Microchip", amount: 800 }], tint: "#CFEADF", about: "Curious and playful, Milo loves boxes, feather toys and afternoon naps in the sun.", requirements: "Cat-proofed balcony." },
];

export const conversations = [
  {
    id: "c1",
    petId: "p1",
    with: "Happy Paws Shelter",
    messages: [
      { from: "them", text: "Hi! Thanks for your interest in Lola." },
      { from: "me", text: "Is she good with other dogs?" },
      { from: "them", text: "Yes, very social. Would Saturday work for a visit?" },
    ],
  },
];

export const notifications = [
  { id: "n1", title: "Application approved", body: "Your application for Lola was approved.", time: "2h ago" },
  { id: "n2", title: "New message", body: "Happy Paws Shelter replied.", time: "5h ago" },
];

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Application = { id: string; petId: string; status: ApplicationStatus; date: string };

export const initialApplications: Application[] = [
  { id: "a1", petId: "p3", status: "PENDING", date: "2 days ago" },
];

export type Story = { id: string; petId: string; petName: string; family: string; city: string; title: string; excerpt: string; image: string };

export const stories: Story[] = [
  { id: "st1", petId: "p1", petName: "Lola", family: "The Rahman family", city: "Dhaka", title: "Lola found her sofa", excerpt: "Within a week Lola had claimed the best seat in the house. Three months on she greets every visitor with a toy in her mouth.", image: img("1561037404-61cd46aa615b", 700) },
  { id: "st2", petId: "p6", petName: "Mochi", family: "Tania and Arif", city: "Uttara", title: "A gentle giant at home", excerpt: "Mochi was shy at first, but daily park walks turned her into the neighbourhood's favourite golden girl.", image: img("1611003228941-98852ba62227", 700) },
  { id: "st3", petId: "p3", petName: "Luna", family: "Nusrat", city: "Gulshan", title: "Window watching, together", excerpt: "Luna and Nusrat share a quiet routine: morning sun, a soft blanket and a very loud purr.", image: img("1574158622682-e40e69881006", 700) },
  { id: "st4", petId: "p4", petName: "Yuri", family: "The Chowdhury family", city: "Sylhet", title: "Short legs, big adventures", excerpt: "Yuri learned three new tricks in his first month and now leads every family weekend hike.", image: img("1537151625747-768eb6cf92b2", 700) },
];

export type VisitStatus = "REQUESTED" | "CONFIRMED" | "CANCELLED";
export type Visit = { id: string; petId: string; date: string; time: string; status: VisitStatus }; // date is ISO yyyy-mm-dd

export const visitSlots = ["10:00 AM", "11:30 AM", "1:00 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const initialVisits: Visit[] = [
  { id: "v1", petId: "p3", date: isoDay(2), time: "11:30 AM", status: "CONFIRMED" },
  { id: "v2", petId: "p1", date: isoDay(-6), time: "3:00 PM", status: "CONFIRMED" },
];
