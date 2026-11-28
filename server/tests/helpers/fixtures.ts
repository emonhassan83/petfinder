import crypto from "crypto";
import bcrypt from "bcrypt";
import request from "supertest";
import { Gender, PetStatus, ShelterMemberRole, ShelterType, UserRole, UserStatus, VerificationStatus } from "@prisma/client";
import app from "../../src/app";
import prisma from "../../src/shared/prisma";

export { app, prisma, request };

export const PASSWORD = "Initial-pass-123";
//* Low bcrypt cost keeps fixture creation fast; the code under test uses its own cost for hashing
const FIXTURE_BCRYPT_COST = 4;

//* Tables truncated by each suite (CASCADE clears every table that references them)
export const CORE_TABLES = ["users", "plans", "stripe_events", "audit_logs"];

let counter = 0;
export const uniq = (label = "t") =>
  `${label}${Date.now().toString(36)}${(counter++).toString(36)}${crypto.randomBytes(3).toString("hex")}`;

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const truncate = async (tables: string[] = CORE_TABLES) => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
};

export const createUser = async (role: UserRole, opts: { status?: UserStatus; password?: string; name?: string } = {}) => {
  const password = await bcrypt.hash(opts.password ?? PASSWORD, FIXTURE_BCRYPT_COST);
  return prisma.user.create({
    data: {
      name: opts.name ?? `Test ${role}`,
      email: `${uniq("u")}@petfinder.test`,
      password,
      role,
      status: opts.status ?? UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
};

export const login = (email: string, password = PASSWORD) =>
  request(app).post("/api/v1/auth/login").send({ email, password });

export const loginAs = async (user: { email: string }, password = PASSWORD) => {
  const res = await login(user.email, password);
  if (res.status !== 200) throw new Error(`login failed for ${user.email}: ${res.status} ${JSON.stringify(res.body)}`);
  return { accessToken: res.body.data.accessToken as string, refreshToken: res.body.data.refreshToken as string };
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export const createPet = (
  userId: string,
  opts: { status?: PetStatus; shelterId?: string | null; name?: string } = {}
) =>
  prisma.pet.create({
    data: {
      name: opts.name ?? uniq("pet"),
      image: "https://example.com/pet.jpg",
      species: "Dog",
      breed: "Mixed",
      location: "Dhaka",
      color: "Black",
      colors: ["black"],
      age: 2,
      gender: Gender.Male,
      size: "Medium",
      description: "Test listing",
      temperament: "Calm",
      medicalHistory: "None",
      adoptionRequirements: "None",
      healthStatus: "Healthy",
      status: opts.status ?? PetStatus.PUBLISHED,
      userId,
      shelterId: opts.shelterId ?? null,
    },
  });

export const createShelter = (userId: string) =>
  prisma.shelterProfile.create({
    data: {
      userId,
      type: ShelterType.SHELTER,
      name: uniq("shelter"),
      slug: uniq("slug"),
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
    },
  });

export const addMember = (shelterId: string, userId: string, role: ShelterMemberRole) =>
  prisma.shelterMember.create({ data: { shelterId, userId, role } });

export const adoptionAnswers = () => ({
  petsHousehold: "Two adults, no children",
  petOwnershipExperience: "Owned dogs for ten years",
  petsNeutered: "YES",
  secureOutdoorArea: "YES",
  animalSleep: "Indoor",
  animalAlonePeriodsTime: "NO",
  detailsSupport: "Family support available",
});

export const disconnect = () => prisma.$disconnect();
