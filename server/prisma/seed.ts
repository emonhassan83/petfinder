//* Idempotent seed: lookups, plans, settings, CMS, admin accounts and a sample shelter.
//* Run: npx prisma db seed (existing rows are kept; passwords are only set on first create).
import { PrismaClient, PetStatus, ShelterType, UserRole, VerificationStatus, Gender, MediaType } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const password = (value: string | undefined, devDefault: string, name: string) => {
  if (value) return value;
  if (config.isProduction) throw new Error(`${name} must be set to seed in production`);
  return devDefault;
};

const species: Record<string, string[]> = {
  Dog: ["Labrador", "Beagle", "German Shepherd", "Golden Retriever", "Pug", "Mixed"],
  Cat: ["Siamese", "Maine Coon", "Persian", "Bengal", "Mixed"],
  Rabbit: ["Holland Lop", "Lionhead", "Mixed"],
  Bird: ["Budgerigar", "Cockatiel", "Lovebird"],
};

const locations = [
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", lat: 22.3569, lng: 91.7832 },
  { name: "Sylhet", lat: 24.8949, lng: 91.8687 },
  { name: "Khulna", lat: 22.8456, lng: 89.5403 },
  { name: "Rajshahi", lat: 24.3745, lng: 88.6042 },
  { name: "Barishal", lat: 22.701, lng: 90.3535 },
  { name: "Rangpur", lat: 25.7439, lng: 89.2752 },
  { name: "Mymensingh", lat: 24.7471, lng: 90.4203 },
];

//* Matches mockPlans in portal/src/mock/shelter.ts (prices in cents)
const plans = [
  { code: "free", name: "Free", priceMonthly: 0, priceYearly: 0, maxListings: 3, maxMediaPerListing: 5, maxFeatured: 0, maxMembers: 1, analytics: false, sortOrder: 0 },
  { code: "pro", name: "Pro", priceMonthly: 1900, priceYearly: 19000, maxListings: 25, maxMediaPerListing: 12, maxFeatured: 2, maxMembers: 5, analytics: true, sortOrder: 1 },
  { code: "premium", name: "Premium", priceMonthly: 4900, priceYearly: 49000, maxListings: 100, maxMediaPerListing: 20, maxFeatured: 10, maxMembers: 20, analytics: true, sortOrder: 2 },
];

//* First-year cost estimates (BDT), mirrored from portal/src/lib/petCosts.ts
const costEstimates = {
  currency: "BDT",
  vaccineCost: { Dog: 1500, Cat: 1200, Rabbit: 600 },
  foodMonthly: {
    Dog: { Small: 1800, Medium: 3200, Large: 5000 },
    Cat: { Small: 1500, Medium: 1900, Large: 2300 },
    Rabbit: { Small: 1200, Medium: 1400, Large: 1600 },
  },
  foodTier: { basic: 0.8, standard: 1, premium: 1.5 },
  vetYearly: { routine: 4000, plus: 9000 },
  setup: { Dog: 6000, Cat: 5000, Rabbit: 4500 },
};

const upsertUser = async (email: string, name: string, role: UserRole, plain: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      email,
      name,
      role,
      password: await bcrypt.hash(plain, 12),
      emailVerified: true,
      contactNumber: "",
      address: "Dhaka",
    },
  });
};

async function main() {
  //* Lookups
  const speciesIds: Record<string, string> = {};
  let order = 0;
  for (const [name, breeds] of Object.entries(species)) {
    const sp = await prisma.species.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name), sortOrder: order++ },
    });
    speciesIds[name] = sp.id;
    for (const breed of breeds) {
      await prisma.breed.upsert({
        where: { speciesId_slug: { speciesId: sp.id, slug: slugify(breed) } },
        update: {},
        create: { speciesId: sp.id, name: breed, slug: slugify(breed) },
      });
    }
  }
  const locationIds: Record<string, string> = {};
  for (const loc of locations) {
    const row = await prisma.location.upsert({
      where: { slug: slugify(loc.name) },
      update: { lat: loc.lat, lng: loc.lng },
      create: { name: loc.name, slug: slugify(loc.name), city: loc.name, lat: loc.lat, lng: loc.lng },
    });
    locationIds[loc.name] = row.id;
  }

  //* Plans (limits are kept in sync on every run; Stripe price ids are never overwritten)
  for (const plan of plans) {
    const { code, ...rest } = plan;
    await prisma.plan.upsert({ where: { code }, update: rest, create: { code, ...rest } });
  }

  //* Settings + CMS
  await prisma.setting.upsert({
    where: { key: "cost.estimates" },
    update: {},
    create: { key: "cost.estimates", value: costEstimates, description: "First-year cost calculator constants" },
  });
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        { question: "How does adoption work?", answer: "Browse pets, submit an application, chat with the shelter, then arrange a visit.", sortOrder: 0 },
        { question: "Is there a fee?", answer: "Fees are set by each shelter or owner. PetFinder never charges adopters.", sortOrder: 1 },
      ],
    });
  }
  for (const title of ["Terms of Service", "Privacy Policy", "Adoption Guidelines"]) {
    await prisma.page.upsert({
      where: { slug: slugify(title) },
      update: {},
      create: { slug: slugify(title), title, body: `${title} content goes here.` },
    });
  }

  //* Accounts
  const s = config.seed;
  await upsertUser(s.super_admin_email, "Super Admin", UserRole.SUPER_ADMIN, password(s.super_admin_password, "superadmin123", "SEED_SUPER_ADMIN_PASSWORD"));
  await upsertUser(s.admin_email, "Admin", UserRole.ADMIN, password(s.admin_password, "admin123", "SEED_ADMIN_PASSWORD"));
  const shelterUser = await upsertUser(s.shelter_email, "Happy Paws Shelter", UserRole.SHELTER, password(s.shelter_password, "shelter123", "SEED_SHELTER_PASSWORD"));
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: s.admin_email } });

  //* Sample verified shelter with a weekly visit template and two listings
  const shelter = await prisma.shelterProfile.upsert({
    where: { userId: shelterUser.id },
    update: {},
    create: {
      userId: shelterUser.id,
      type: ShelterType.SHELTER,
      name: "Happy Paws Shelter",
      slug: "happy-paws",
      description: "A volunteer-run shelter rehoming dogs and cats across Dhaka.",
      email: s.shelter_email,
      phone: "+8801700000000",
      address: "House 12, Road 5, Dhanmondi, Dhaka",
      locationId: locationIds.Dhaka,
      lat: 23.7461,
      lng: 90.3742,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedById: admin.id,
    },
  });

  const weekly: Record<number, string[]> = {
    0: ["10:00", "11:00", "15:00", "16:00"],
    1: ["10:00", "11:00", "15:00", "16:00"],
    2: ["14:00", "15:00", "16:00", "17:00"],
    3: ["10:00", "11:00", "15:00", "16:00"],
    4: [],
    5: ["10:00", "11:00", "12:00", "14:00", "15:00"],
    6: ["11:00", "12:00", "14:00"],
  };
  for (const [weekday, times] of Object.entries(weekly)) {
    await prisma.shelterAvailability.upsert({
      where: { shelterId_weekday: { shelterId: shelter.id, weekday: Number(weekday) } },
      update: {},
      create: { shelterId: shelter.id, weekday: Number(weekday), isOpen: times.length > 0, times, capacity: 2 },
    });
  }

  if ((await prisma.pet.count({ where: { shelterId: shelter.id } })) === 0) {
    const breedId = async (sp: string, b: string) =>
      (await prisma.breed.findUniqueOrThrow({ where: { speciesId_slug: { speciesId: speciesIds[sp], slug: slugify(b) } } })).id;

    const samples = [
      {
        name: "Bella", species: "Dog", breed: "Labrador", color: "Golden", age: 3, gender: Gender.Female, size: "Large",
        image: "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800",
        description: "Gentle, house-trained and great with kids.", temperament: "Friendly, calm",
        fees: [["Vaccinations", 150000], ["Microchip", 80000], ["Vet check & deworming", 70000]] as [string, number][],
      },
      {
        name: "Luna", species: "Cat", breed: "Siamese", color: "Cream", age: 1, gender: Gender.Female, size: "Small",
        image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800",
        description: "Shy at first, then a lap cat.", temperament: "Quiet, affectionate",
        fees: [["Vaccinations", 120000], ["Spay / neuter", 180000]] as [string, number][],
      },
    ];
    for (const p of samples) {
      await prisma.pet.create({
        data: {
          name: p.name,
          image: p.image,
          species: p.species,
          breed: p.breed,
          color: p.color,
          colors: [p.color],
          age: p.age,
          gender: p.gender,
          size: p.size,
          location: "Dhaka",
          description: p.description,
          temperament: p.temperament,
          medicalHistory: "Vaccinated and dewormed.",
          adoptionRequirements: "Home visit and signed adoption agreement.",
          healthStatus: "Healthy",
          status: PetStatus.PUBLISHED,
          userId: shelterUser.id,
          shelterId: shelter.id,
          speciesId: speciesIds[p.species],
          breedId: await breedId(p.species, p.breed),
          locationId: locationIds.Dhaka,
          lat: 23.7461,
          lng: 90.3742,
          media: { create: [{ type: MediaType.IMAGE, url: p.image, order: 0, isCover: true }] },
          fees: { create: p.fees.map(([label, amount], i) => ({ label, amount, currency: "BDT", sortOrder: i })) },
        },
      });
    }
  }

  console.log("Seed complete:", {
    species: await prisma.species.count(),
    breeds: await prisma.breed.count(),
    locations: await prisma.location.count(),
    plans: await prisma.plan.count(),
    users: await prisma.user.count(),
    pets: await prisma.pet.count(),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
