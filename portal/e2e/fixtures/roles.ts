import path from "path";

//* The four roles under test. Shelter/admin/super-admin come from server/prisma/seed.ts;
//* the adopter (USER) account is registered through the API by auth.setup.ts if it doesn't exist yet.
export type Role = "user" | "shelter" | "admin" | "superAdmin";

export const ROLES: Role[] = ["user", "shelter", "admin", "superAdmin"];

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:5080/api/v1";

export const accounts: Record<Role, { email: string; password: string; home: string; name: string }> = {
  user: {
    email: process.env.E2E_USER_EMAIL ?? "e2e-user@petfinder.test",
    password: process.env.E2E_USER_PASSWORD ?? "E2e-pass-123",
    home: "/dashboard/user",
    name: "E2E Adopter",
  },
  shelter: {
    email: process.env.E2E_SHELTER_EMAIL ?? "shelter@petfinder.test",
    password: process.env.E2E_SHELTER_PASSWORD ?? "shelter123",
    home: "/dashboard/shelter",
    name: "Happy Paws Shelter",
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@petfinder.test",
    password: process.env.E2E_ADMIN_PASSWORD ?? "admin123",
    home: "/dashboard/admin",
    name: "Admin",
  },
  superAdmin: {
    email: process.env.E2E_SUPER_ADMIN_EMAIL ?? "superadmin@petfinder.test",
    password: process.env.E2E_SUPER_ADMIN_PASSWORD ?? "superadmin123",
    home: "/dashboard/admin",
    name: "Super Admin",
  },
};

//* Saved browser session (cookie + localStorage) per role; use with `test.use({ storageState: storageState("admin") })`
export const storageState = (role: Role) => path.join(__dirname, "..", ".auth", `${role}.json`);
