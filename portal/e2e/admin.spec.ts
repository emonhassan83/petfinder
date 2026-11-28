import { expect, test, type Page } from "@playwright/test";
import { storageState } from "./fixtures/roles";

//* ADMIN role UI (src/utils/drawerItems.ts, src/app/(withDashboardLayout)/dashboard/admin/**).
//* Role-gated controls are checked by their disabled/visible state only; the shared seeded accounts are never mutated.
//* The seeded super admin (superadmin@) and shelter (shelter@) accounts must not be changed by these tests.

const ADMIN_MENU = [
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

const ADMIN_PATHS: Record<string, string> = {
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

test.describe("admin: sidebar and dashboard", () => {
  test.use({ storageState: storageState("admin") });

  test("sidebar shows the full admin menu and none of the user or shelter items", async ({ page }) => {
    await page.goto("/dashboard/admin");
    const nav = page.getByRole("link", { name: "Manage Users", exact: true }).first();
    await expect(nav).toBeVisible();
    for (const title of ADMIN_MENU) {
      await expect(page.getByRole("link", { name: title, exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Manage Adoption", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Team", exact: true })).toHaveCount(0);
  });

  test("every admin menu item navigates to a page that renders without page errors", async ({ page }) => {
    test.setTimeout(300_000);
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/admin");
    for (const title of ADMIN_MENU) {
      //* dispatchEvent: the Next dev error badge overlaps the bottom of the sidebar and would intercept a real click
      await page.getByRole("link", { name: title, exact: true }).first().dispatchEvent("click");
      await page.waitForURL((url) => url.pathname === ADMIN_PATHS[title]);
      //* Every admin page sets a Meta title containing "Petfinder" (Manage Blogs has no heading element)
      await expect(page).toHaveTitle(/Petfinder/);
      await expect(page.getByText("Application error")).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("dashboard renders KPI tiles, chart panels and the newest-users list", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/admin");
    for (const kpi of ["Adoptions completed", "Applications", "Donations"]) {
      await expect(page.getByText(kpi, { exact: true })).toBeVisible();
    }
    for (const chart of ["Users and applications per month", "Users by role", "Pets by status", "Adoption funnel"]) {
      await expect(page.getByText(chart, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Newest users" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent pets" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("admin: manage users", () => {
  test.use({ storageState: storageState("admin") });

  test("list shows the seeded admin and super admin accounts", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    //* The list is paged by newest first, so each seeded account is found through the search box
    const grid = page.getByRole("grid");
    const search = page.getByLabel("Search name or email");
    await search.fill("admin@petfinder.test");
    await expect(grid.getByText("admin@petfinder.test", { exact: true })).toBeVisible();
    await search.fill("superadmin@petfinder.test");
    await expect(grid.getByText("superadmin@petfinder.test", { exact: true })).toBeVisible();
  });

  test("search narrows the list by email", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    const grid = page.getByRole("grid");
    await page.getByLabel("Search name or email").fill("superadmin@petfinder.test");
    await expect(grid.getByText("superadmin@petfinder.test", { exact: true })).toBeVisible();
    await expect(grid.getByText("admin@petfinder.test", { exact: true })).toHaveCount(0);
  });

  test("role filter narrows the list to SHELTER accounts", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    const grid = page.getByRole("grid");
    await page.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "SHELTER", exact: true }).click();
    await expect(grid.getByText("shelter@petfinder.test", { exact: true })).toBeVisible();
    await expect(grid.getByText("admin@petfinder.test", { exact: true })).toHaveCount(0);
  });

  test("admin cannot act on its own row or on the super admin, and is told why", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    await page.getByLabel("Search name or email").fill("petfinder.test");
    await expect(page.getByRole("grid").getByText("superadmin@petfinder.test", { exact: true })).toBeVisible();

    await expect(page.getByRole("button", { name: "Change role of Admin", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Change role of Super Admin", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Change status of Super Admin", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Delete Super Admin", exact: true })).toBeDisabled();
    await expect(page.getByText("can only be managed by a super admin")).toBeVisible();
  });

  test("role dialog for a regular user offers only non-admin roles, and cancelling changes nothing", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-users");
    await page.getByLabel("Search name or email").fill("e2e-user@petfinder.test");
    const row = page.getByRole("grid").getByText("e2e-user@petfinder.test", { exact: true });
    await expect(row).toBeVisible();

    await page.getByRole("button", { name: "Change role of E2E Adopter", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Change role", { exact: true })).toBeVisible();
    await dialog.getByRole("combobox", { name: "Role" }).click();
    for (const role of ["USER", "OWNER", "SHELTER", "SHELTER_MEMBER"]) {
      await expect(page.getByRole("option", { name: role, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("option", { name: "ADMIN", exact: true })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "SUPER_ADMIN", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("admin: content management lists", () => {
  test.use({ storageState: storageState("admin") });

  test("manage pets lists listings and the delete dialog can be cancelled", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-pet");
    await expect(page.getByRole("heading", { name: "Manage pets" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Pet Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Listed by" })).toBeVisible();

    await page.getByRole("grid").getByRole("button", { name: /^Delete / }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Delete listing?", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test("adoption requests switches between all requests and disputes", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-adoption");
    await expect(page.getByRole("tab", { name: /All requests/ })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("tab", { name: /Disputes/ }).click();
    await expect(page.getByRole("tab", { name: /Disputes/ })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("columnheader", { name: "Dispute reason" })).toBeVisible();
    await page.getByRole("tab", { name: /All requests/ }).click();
    await expect(page.getByRole("columnheader", { name: "Applicant" })).toBeVisible();
  });

  test("manage blogs lists posts with author and category columns", async ({ page }) => {
    await page.goto("/dashboard/admin/manage-blogs");
    await expect(page.getByRole("columnheader", { name: "Blog Title" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Blog Category" })).toBeVisible();
  });

  test("shelter verification filters by status", async ({ page }) => {
    await page.goto("/dashboard/admin/verification");
    await expect(page.getByRole("radio", { name: "PENDING", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "REJECTED", exact: true }).click();
    await expect(page.getByRole("radio", { name: "REJECTED", exact: true })).toBeChecked();
    await expect(page.getByRole("radio", { name: "PENDING", exact: true })).not.toBeChecked();
  });

  test("reports queue filters by status", async ({ page }) => {
    await page.goto("/dashboard/admin/reports");
    await expect(page.getByRole("radio", { name: "OPEN", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "DISMISSED", exact: true }).click();
    await expect(page.getByRole("radio", { name: "DISMISSED", exact: true })).toBeChecked();
    await expect(page.getByRole("radio", { name: "OPEN", exact: true })).not.toBeChecked();
  });

  test("success stories filters by moderation state", async ({ page }) => {
    await page.goto("/dashboard/admin/stories");
    await expect(page.getByRole("radio", { name: "In review", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "All", exact: true }).click();
    await expect(page.getByRole("radio", { name: "All", exact: true })).toBeChecked();
  });

  test("subscriptions shows the subscription and transaction tabs but not Plans", async ({ page }) => {
    await page.goto("/dashboard/admin/subscriptions");
    await expect(page.getByRole("tab", { name: "Subscriptions", exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Transactions", exact: true }).click();
    await expect(page.getByRole("columnheader", { name: "Amount" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Plans", exact: true })).toHaveCount(0);
  });

  test("audit logs filters by action and shows the empty state for no match", async ({ page }) => {
    await page.goto("/dashboard/admin/audit-logs");
    await page.getByLabel("Action (exact)").fill(`E2E_NO_SUCH_ACTION_${Date.now()}`);
    await expect(page.getByText("No matching entries.", { exact: true })).toBeVisible();
  });
});

test.describe("admin: create forms", () => {
  test.use({ storageState: storageState("admin") });

  test("add pet shows every listing field", async ({ page }) => {
    await page.goto("/dashboard/admin/add-pet");
    for (const label of ["Pet Name", "Image Url", "Species", "Breed", "Age", "Location", "Temperament", "Description", "Medical History", "Adoption Requirements"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });

  test("add pet rejects an empty submission on the server and creates nothing", async ({ page }) => {
    await page.goto("/dashboard/admin/add-pet");
    await expect(page.getByLabel("Pet Name", { exact: true })).toBeVisible();
    const response = page.waitForResponse((r) => r.request().method() === "POST" && r.url().endsWith("/pets"));
    await page.getByRole("button", { name: "Add Pet", exact: true }).click();
    expect((await response).status()).toBeGreaterThanOrEqual(400);
    await expect(page.getByText("Pet created successfully!", { exact: true })).toHaveCount(0);
  });

  test("add blog shows its fields", async ({ page }) => {
    await page.goto("/dashboard/admin/add-blog");
    for (const label of ["Blog Name", "Blog Image Url", "Blog Reference", "Blog Tags", "Blog Description"]) {
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    }
  });

  test("add blog rejects an empty submission with a validation response, not a client TypeError", async ({ page }) => {
    await page.goto("/dashboard/admin/add-blog");
    await expect(page.getByLabel("Blog Name", { exact: true })).toBeVisible();
    //* The form reads the profile id before submitting, so wait for the profile request to settle
    await page.waitForLoadState("networkidle");
    const response = page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/blog/add-blog"));
    await page.getByRole("button", { name: "Add A Blog", exact: true }).click();
    expect((await response).status()).toBeGreaterThanOrEqual(400);
    await expect(page).toHaveURL(/\/dashboard\/admin\/add-blog$/);
  });

  test("lookups: a unique species is added and then deleted", async ({ page }) => {
    const name = `E2E ${Date.now()}`;
    await page.goto("/dashboard/admin/lookups");
    await page.getByLabel("Add to species", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete ${name}`, exact: true }).click();
    await expect(page.getByRole("cell", { name, exact: true })).toHaveCount(0);
  });

  test("CMS: a unique FAQ is added and then deleted; new page needs a title and body", async ({ page }) => {
    const question = `E2E ${Date.now()} question?`;
    await page.goto("/dashboard/admin/cms");

    await page.getByRole("button", { name: "New page", exact: true }).click();
    const pageDialog = page.getByRole("dialog");
    await expect(pageDialog.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await pageDialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(pageDialog).toBeHidden();

    await page.getByLabel("Question", { exact: true }).fill(question);
    await page.getByLabel("Answer", { exact: true }).fill("E2E answer");
    await page.getByRole("button", { name: "Add FAQ", exact: true }).click();
    await expect(page.getByText(question, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Delete FAQ ${question}`, exact: true }).click();
    await expect(page.getByText(question, { exact: true })).toHaveCount(0);
  });
});
