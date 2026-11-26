//* Mock data until the API exists (Phase 3/4).
export type Pet = {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Rabbit";
  breed: string;
  age: number;
  gender: "Male" | "Female";
  location: string;
  shelter: string;
  verified: boolean;
  image: string;
  about: string;
  requirements: string;
};

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

export const pets: Pet[] = [
  { id: "p1", name: "Bella", species: "Dog", breed: "Labrador", age: 3, gender: "Female", location: "Dhaka", shelter: "Happy Paws Shelter", verified: true, image: img("bella"), about: "Friendly, house-trained and great with kids and other dogs.", requirements: "Fenced yard preferred. Home visit before adoption." },
  { id: "p2", name: "Max", species: "Dog", breed: "Beagle", age: 2, gender: "Male", location: "Chattogram", shelter: "Rina (owner)", verified: false, image: img("max"), about: "Energetic and curious. Fully vaccinated and microchipped.", requirements: "Daily walks. Experienced owner preferred." },
  { id: "p3", name: "Luna", species: "Cat", breed: "Siamese", age: 1, gender: "Female", location: "Dhaka", shelter: "Happy Paws Shelter", verified: true, image: img("luna"), about: "Calm lap cat who loves window watching.", requirements: "Indoor home only." },
  { id: "p4", name: "Oscar", species: "Cat", breed: "Maine Coon", age: 4, gender: "Male", location: "Sylhet", shelter: "Second Chance Rescue", verified: true, image: img("oscar"), about: "Gentle giant, litter trained, good with children.", requirements: "No other cats." },
  { id: "p5", name: "Coco", species: "Rabbit", breed: "Holland Lop", age: 1, gender: "Female", location: "Khulna", shelter: "Second Chance Rescue", verified: true, image: img("coco"), about: "Quiet and cuddly. Eats hay and fresh greens.", requirements: "Spacious indoor enclosure." },
];

export const conversations = [
  {
    id: "c1",
    petId: "p1",
    with: "Happy Paws Shelter",
    messages: [
      { from: "them", text: "Hi! Thanks for your interest in Bella." },
      { from: "me", text: "Is she good with other dogs?" },
      { from: "them", text: "Yes, very social. Would Saturday work for a visit?" },
    ],
  },
];

export const notifications = [
  { id: "n1", title: "Application approved", body: "Your application for Bella was approved.", time: "2h ago" },
  { id: "n2", title: "New message", body: "Happy Paws Shelter replied.", time: "5h ago" },
];

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Application = { id: string; petId: string; status: ApplicationStatus; date: string };

export const initialApplications: Application[] = [
  { id: "a1", petId: "p3", status: "PENDING", date: "2 days ago" },
];
