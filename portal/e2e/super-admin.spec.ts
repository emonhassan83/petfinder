import { expect, test, type Page } from "@playwright/test";
import { storageState } from "./fixtures/roles";

//* SUPER_ADMIN role UI: the admin menu plus the extra controls that only a super admin gets
//* (ADMIN/SUPER_ADMIN role options, admin-account actions, the Plans tab). Nothing here mutates the seeded accounts:
//* role dialogs are opened and cancelled, and the plan dialog is opened and closed without saving.

const SUPER_MENU = [
  "Dashboard",
  "Manage Users",
  "Add Pet",
  "Manage Pets",
  "Adoption Requests",
  "Add Blog",
  "Manage Blogs",
  "Shelter Verification",
  "Reports",
  "Success Stories",
  "Subscriptions",
  "Lookups",
  "Content (CMS)",
  "Audit Logs",
  "My Profile",
];

const SUPER_PATHS: Record<string, string> = {
  Dashboard: "/dashboard/admin",
  "Manage Users": "/dashboard/admin/manage-users",
  "Add Pet": "/dashboard/admin/add-pet",
  "Manage Pets": "/dashboard/admin/manage-pet",
  "Adoption Requests": "/dashboard/admin/manage-adoption",
  "Add Blog": "/dashboard/admin/add-blog",
  "Manage Blogs": "/dashboard/admin/manage-blogs",
  "Shelter Verification": "/dashboard/admin/verification",
  Reports: "/dashboard/admin/reports",
  "Success Stories": "/dashboard/admin/stories",
  Subscriptions: "/dashboard/admin/subscriptions",
  Lookups: "/dashboard/admin/lookups",
  "Content (CMS)": "/dashboard/admin/cms",
  "Audit Logs": "/dashboard/admin/audit-logs",
  "My Profile": "/dashboard/profile",
};

const trackPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

test.describe("super admin: sidebar and navigation", () => {
  test.use({ storageState: storageState("superAdmin") });

  test("sidebar shows the same full admin menu", async ({ page }) => {
    await page.goto("/dashboard/admin");
    for (const title of SUPER_MENU) {
      await expect(page.getByRole("link", { name: title, exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Manage Adoption", exact: true })).toHaveCount(0);
  });

  test("every menu item navigates to a page that renders without page errors", async ({ page }) => {
    test.setTimeout(300_000);
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/admin");
    for (const title of SUPER_MENU) {
      //* dispatchEvent: the Next dev error badge overlaps the bottom of the sidebar and would intercept a real click
      await page.getByRole("link", { name: title, exact: true }).first().dispatchEvent("click");
      await page.waitForURL((url) => url.pathname === SUPER_PATHS[title]);
      //* Every admin page sets a Meta title containing "Petfinder" (Manage Blogs has no heading element)
      await expect(page).toHaveTitle(/Petfinder/);
      await expect(page.getByText("Application error")).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("super admin: manage users", () => {
  test.use({ storageState: storageState("superAdmin") });

  test("role dialog for the seeded admin offers ADMIN and SUPER_ADMIN, and cancelling changes nothing", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    await page.getByLabel("Search name or email").fill("admin@petfinder.test");
    await expect(page.getByRole("grid").getByText("admin@petfinder.test", { exact: true })).toBeVisible();

    const changeRole = page.getByRole("button", { name: "Change role of Admin", exact: true });
    await expect(changeRole).toBeEnabled();
    await changeRole.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Change role", { exact: true })).toBeVisible();
    await dialog.getByRole("combobox", { name: "Role" }).click();
    for (const role of ["USER", "OWNER", "SHELTER", "SHELTER_MEMBER", "ADMIN", "SUPER_ADMIN"]) {
      await expect(page.getByRole("option", { name: role, exact: true })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test("own row is locked, and the admin-only notice is not shown", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    await page.getByLabel("Search name or email").fill("superadmin@petfinder.test");
    await expect(page.getByRole("grid").getByText("superadmin@petfinder.test", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change role of Super Admin", exact: true })).toBeDisabled();
    await expect(page.getByText("can only be managed by a super admin")).toHaveCount(0);
  });
});

test.describe("super admin: plans and audit", () => {
  test.use({ storageState: storageState("superAdmin") });

  test("subscriptions shows the Plans tab; new plan dialog needs a name before it can save", async ({ page }) => {
    await page.goto("/dashboard/admin/subscriptions");
    await page.getByRole("tab", { name: "Plans", exact: true }).click();
    await page.getByRole("button", { name: "New plan", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("New plan", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test("audit logs can be filtered by SUPER_ADMIN actor role", async ({ page }) => {
    await page.goto("/dashboard/admin/audit-logs");
    await page.getByRole("combobox", { name: "Actor role" }).click();
    await expect(page.getByRole("option", { name: "SUPER_ADMIN", exact: true })).toBeVisible();
    await page.getByRole("option", { name: "SUPER_ADMIN", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Actor role" })).toHaveText("SUPER_ADMIN");
  });
});
