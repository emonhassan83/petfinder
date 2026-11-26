//* Preview data used when the API returns nothing (Phase 3/4 replaces this).
export const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

export const heroPetImage = unsplash("1543466835-00a7907e9de1", 1000);
export const adoptingGuideImage = unsplash("1552053831-71594a27632d", 1000);

export type PreviewPet = {
  id: string;
  name: string;
  species: "Dog" | "Cat" | "Rabbit";
  breed: string;
  age: number;
  gender: "Male" | "Female";
  size: "Small" | "Medium" | "Large";
  color: string;
  location: string;
  shelterId: string;
  image: string;
  photos: string[];
  description: string;
  traits: string[];
  goodWith: string[];
  houseTrained: boolean;
  vaccinated: boolean;
  spayedNeutered: boolean;
  fee: number;
};

const p = (id: string) => unsplash(id);

export const previewPets: PreviewPet[] = [
  { id: "preview-1", name: "Yuri", species: "Dog", breed: "Corgi", age: 1, gender: "Male", size: "Small", color: "Red & white", location: "Dhanmondi, Dhaka", shelterId: "happy-paws", image: p("1537151625747-768eb6cf92b2"), photos: [p("1537151625747-768eb6cf92b2"), p("1583337130417-3346a1be7dee"), p("1587300003388-59208cc962cb")], description: "Yuri is a bundle of joy with short legs and a big heart. He is house-trained, knows sit, paw and down, and greets everyone with a wagging tail. He would love a family that enjoys short walks and long cuddles.", traits: ["Playful", "Friendly", "Smart"], goodWith: ["Children", "Dogs"], houseTrained: true, vaccinated: true, spayedNeutered: false, fee: 8000 },
  { id: "preview-2", name: "Darcie", species: "Cat", breed: "Tabby", age: 1, gender: "Female", size: "Small", color: "Brown tabby", location: "Gulshan, Dhaka", shelterId: "happy-paws", image: p("1574158622682-e40e69881006"), photos: [p("1574158622682-e40e69881006"), p("1495360010541-f48722b34f7d")], description: "Darcie is a calm lap cat who loves window watching and soft blankets. She is litter trained, gentle with children, and purrs the moment you sit down.", traits: ["Calm", "Affectionate"], goodWith: ["Children", "Cats"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 5000 },
  { id: "preview-3", name: "Mochi", species: "Dog", breed: "Golden Retriever", age: 2, gender: "Female", size: "Large", color: "Golden", location: "Agrabad, Chattogram", shelterId: "second-chance", image: p("1611003228941-98852ba62227"), photos: [p("1611003228941-98852ba62227"), p("1552053831-71594a27632d")], description: "Mochi is a sweet, soft girl who will grow into a loyal, gentle giant. Great with kids and other dogs, she loves fetch and swimming.", traits: ["Gentle", "Loyal", "Energetic"], goodWith: ["Children", "Dogs", "Cats"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 12000 },
  { id: "preview-4", name: "Pepper", species: "Dog", breed: "Jack Russell", age: 3, gender: "Male", size: "Small", color: "Tricolour", location: "Zindabazar, Sylhet", shelterId: "second-chance", image: p("1561037404-61cd46aa615b"), photos: [p("1561037404-61cd46aa615b")], description: "Pepper is clever and curious, always ready for a game. He does best with an active family and a secure garden.", traits: ["Curious", "Active"], goodWith: ["Dogs"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 7000 },
  { id: "preview-5", name: "Snow", species: "Rabbit", breed: "Holland Lop", age: 1, gender: "Female", size: "Small", color: "White", location: "Sonadanga, Khulna", shelterId: "bunny-haven", image: p("1585110396000-c9ffd4e4b308"), photos: [p("1585110396000-c9ffd4e4b308")], description: "Snow is quiet and cuddly. She eats hay and fresh greens and loves gentle strokes behind the ears.", traits: ["Quiet", "Cuddly"], goodWith: ["Children"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 3000 },
  { id: "preview-6", name: "Milo", species: "Cat", breed: "Domestic Shorthair", age: 2, gender: "Male", size: "Medium", color: "Black & white", location: "Mirpur, Dhaka", shelterId: "happy-paws", image: p("1514888286974-6c03e2ca1dba"), photos: [p("1514888286974-6c03e2ca1dba"), p("1592194996308-7b43878e84a6")], description: "Milo loves boxes, feather toys and afternoon naps in the sun. He is a social cat who follows you from room to room.", traits: ["Social", "Playful"], goodWith: ["Cats", "Dogs"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 5000 },
  { id: "preview-7", name: "Bruno", species: "Dog", breed: "Pug", age: 4, gender: "Male", size: "Small", color: "Black", location: "Shaheb Bazar, Rajshahi", shelterId: "bunny-haven", image: p("1517849845537-4d257902454a"), photos: [p("1517849845537-4d257902454a")], description: "Bruno is a relaxed gentleman who loves snoring on the sofa and short strolls. Perfect for apartment living.", traits: ["Relaxed", "Affectionate"], goodWith: ["Children", "Dogs", "Cats"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 6000 },
  { id: "preview-8", name: "Koda", species: "Dog", breed: "Siberian Husky", age: 3, gender: "Male", size: "Large", color: "Grey & white", location: "Uttara, Dhaka", shelterId: "second-chance", image: p("1568572933382-74d440642117"), photos: [p("1568572933382-74d440642117")], description: "Koda is a striking, talkative husky who needs daily exercise and an experienced owner. He is gentle and loves people.", traits: ["Vocal", "Energetic"], goodWith: ["Dogs"], houseTrained: true, vaccinated: true, spayedNeutered: true, fee: 11000 },
];

export const previewShelters = [
  { id: "happy-paws", name: "Happy Paws Shelter", city: "Dhaka", address: "House 12, Road 5, Dhanmondi, Dhaka", phone: "+880 1700-000001", email: "hello@happypaws.example", verified: true, rating: 4.8, reviews: 126, since: 2016, image: unsplash("1583337130417-3346a1be7dee", 900), about: "A volunteer-run shelter rescuing and rehoming dogs and cats across Dhaka since 2016. Every pet is vaccinated, vet-checked and behaviour assessed before adoption." },
  { id: "second-chance", name: "Second Chance Rescue", city: "Chattogram", address: "Agrabad C/A, Chattogram", phone: "+880 1700-000002", email: "adopt@secondchance.example", verified: true, rating: 4.6, reviews: 84, since: 2018, image: unsplash("1518717758536-85ae29035b6d", 900), about: "We give abandoned and surrendered pets a second chance with foster homes, medical care and careful matching with new families." },
  { id: "bunny-haven", name: "Bunny Haven & Friends", city: "Khulna", address: "Sonadanga R/A, Khulna", phone: "+880 1700-000003", email: "care@bunnyhaven.example", verified: false, rating: 4.4, reviews: 31, since: 2021, image: unsplash("1548767797-d8c844163c4c", 900), about: "A small rescue focused on rabbits, guinea pigs and small dogs. Verification in progress." },
];

export const previewArticles = [
  { id: "a1", category: "Dog adoption", title: "Your first 30 days with an adopted dog", excerpt: "A week-by-week plan to help your new dog settle in, from the car ride home to the first vet visit.", image: unsplash("1587300003388-59208cc962cb"), read: "6 min" },
  { id: "a2", category: "Dog adoption", title: "How to choose the right dog for your lifestyle", excerpt: "Energy level, size and grooming needs matter more than looks. Here is how to find your match.", image: unsplash("1544568100-847a948585b9"), read: "5 min" },
  { id: "a3", category: "Cat adoption", title: "Bringing home a shy cat", excerpt: "Safe rooms, slow introductions and the small signs that your cat is starting to trust you.", image: unsplash("1495360010541-f48722b34f7d"), read: "4 min" },
  { id: "a4", category: "Cat adoption", title: "Kitten or adult cat? What to consider", excerpt: "Adult cats come with known personalities. Kittens need time and training. Compare both.", image: unsplash("1592194996308-7b43878e84a6"), read: "5 min" },
];

export const findPreviewPet = (id: string) => previewPets.find((x) => x.id === id);
export const findPreviewShelter = (id: string) => previewShelters.find((x) => x.id === id);
