import { expect, test } from "@playwright/test";
import { ROLES, accounts, storageState } from "./fixtures/roles";

//* Route guard matrix (src/middleware.ts): every role reaches its own dashboard and is bounced home from the others.
const areas = { user: "/dashboard/user/favorites", shelter: "/dashboard/shelter/listings", admin: "/dashboard/admin/manage-users" };
const ownArea = { user: "user", shelter: "shelter", admin: "admin", superAdmin: "admin" } as const;

test.describe("anonymous visitor", () => {
  test("every dashboard area redirects to login with a redirect back", async ({ page }) => {
    for (const target of [...Object.values(areas), "/dashboard", "/dashboard/profile"]) {
      await page.goto(target);
      await page.waitForURL((url) => url.pathname === "/login");
      expect(new URL(page.url()).searchParams.get("redirect")).toBe(target);
    }
  });

  test("a forged access-token cookie is rejected and cleared", async ({ page, context, baseURL }) => {
    const fake = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4Iiwicm9sZSI6IkFETUlOIn0.invalidsignature";
    await context.addCookies([{ name: "accessToken", value: fake, url: baseURL! }]);
    await page.goto(areas.admin);
    await page.waitForURL((url) => url.pathname === "/login");
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "accessToken")).toBeUndefined();
  });
});

for (const role of ROLES) {
  test.describe(`${role} route access`, () => {
    test.use({ storageState: storageState(role) });

    test("lands on its own dashboard from /dashboard and /login", async ({ page }) => {
      for (const entry of ["/dashboard", "/login"]) {
        await page.goto(entry);
        await page.waitForURL((url) => url.pathname === accounts[role].home);
      }
    });

    test("can open the shared profile page", async ({ page }) => {
      await page.goto("/dashboard/profile");
      await expect(page).toHaveURL(/\/dashboard\/profile$/);
    });

    test("is redirected home from other roles' dashboards, and can open its own", async ({ page }) => {
      for (const [area, path] of Object.entries(areas)) {
        await page.goto(path);
        if (area === ownArea[role]) {
          await expect(page).toHaveURL(new RegExp(`${path}$`));
        } else {
          await page.waitForURL((url) => url.pathname === accounts[role].home);
        }
      }
    });
  });
}
