import { expect, test, type Page } from "@playwright/test";
import { API_URL, accounts, storageState } from "./fixtures/roles";

//* Shelter dashboard UI tests (src/app/(withDashboardLayout)/dashboard/shelter/**).
//* Shared seeded account: Bella and Luna are never touched. The only listing this file creates is named
//* `E2E pet <timestamp>`; afterAll deletes every such listing through the API (no UI delete control exists yet).

test.use({ storageState: storageState("shelter") });

const LISTING_NAME = `E2E pet ${Date.now()}`;
const LISTING_PATTERN = /^E2E pet \d+$/;

//* Sidebar items from src/utils/drawerItems.ts (SHELTER role), in menu order
const menu = [
  { title: "Overview", path: "/dashboard/shelter", heading: /^Overview$/ },
  { title: "My Listings", path: "/dashboard/shelter/listings", heading: /^My listings$/ },
  { title: "Applications", path: "/dashboard/shelter/applications", heading: /^Applications$/ },
  { title: "Visits", path: "/dashboard/shelter/visits", heading: /^Visits$/ },
  { title: "Success Stories", path: "/dashboard/shelter/stories", heading: /^Success stories$/ },
  { title: "Messages", path: "/dashboard/shelter/messages", heading: null },
  { title: "Team", path: "/dashboard/shelter/members", heading: /^Team$/ },
  { title: "Plan & Billing", path: "/dashboard/shelter/billing", heading: /^Plan & billing$/ },
  { title: "My Profile", path: "/dashboard/profile", heading: null },
];

const sidebarLinks = (page: Page) => page.locator("a[href^='/dashboard/']:has(.MuiListItemText-root)");

//* Opens the Add listing dialog's Details tab and fills the required fields (Dog, first location)
const fillRequiredListingFields = async (page: Page, name: string) => {
  await page.getByLabel(/^Pet name/).fill(name);
  await page.getByRole("combobox", { name: /^Species/ }).click();
  await page.getByRole("option", { name: "Dog", exact: true }).click();
  await page.getByRole("combobox", { name: /^Location/ }).click();
  await page.getByRole("option").first().click();
  await page.getByLabel(/^Colours/).fill("Golden");
  await page.getByLabel(/^Description/).fill("Created by the automated UI test. Safe to delete.");
};

test.describe("shelter dashboard", () => {
  test("sidebar shows exactly the shelter menu, including Team and no admin or adopter items", async ({ page }) => {
    await page.goto("/dashboard/shelter");
    //* The menu is built after the role is read from localStorage, so wait for the first item before reading all of them
    await expect(page.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
    //* The sidebar is rendered twice (permanent drawer and mobile drawer), so compare unique titles in menu order
    const titles = Array.from(new Set((await sidebarLinks(page).allTextContents()).map((t) => t.trim())));
    expect(titles).toEqual(menu.map((m) => m.title));
    await expect(page.getByRole("link", { name: "Manage Users", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Manage Adoption", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Saved Pets", exact: true })).toHaveCount(0);
  });

  test("every sidebar item opens a page that renders without runtime errors", async ({ page }) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/dashboard/shelter");
    for (const item of menu) {
      await page.getByRole("link", { name: item.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${item.path}$`));
      if (item.heading) {
        await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      } else {
        await expect(page.locator("main, body").first()).toBeVisible();
      }
      await expect(page.getByText("Could not load this data.")).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test("overview shows the shelter name, KPI tiles and the Free-plan analytics upsell", async ({ page }) => {
    await page.goto("/dashboard/shelter");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText(accounts.shelter.name, { exact: false }).first()).toBeVisible();
    for (const label of ["Active listings", "Total views", "Pending applications", "Adoptions"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Listing analytics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/dashboard/shelter/billing");
  });

  test("my listings shows the seeded Bella and Luna listings and the plan usage bar", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    await expect(page.getByRole("heading", { name: "My listings" })).toBeVisible();
    await expect(page.getByText(/^Free plan: \d+ of 3 active listings used$/)).toBeVisible();
    for (const name of ["Bella", "Luna"]) {
      const row = page.getByRole("row").filter({ hasText: name });
      await expect(row).toHaveCount(1);
      await expect(row.getByRole("button", { name: `Edit ${name}` })).toBeVisible();
    }
  });

  test("add listing keeps Save draft disabled until the required fields are filled", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    await page.getByRole("button", { name: "Add listing" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Add listing" })).toBeVisible();
    const save = dialog.getByRole("button", { name: "Save draft" });
    await expect(save).toBeDisabled();

    await dialog.getByLabel(/^Pet name/).fill("Validation check");
    await expect(save).toBeDisabled();

    await dialog.getByLabel(/^Description/).fill("Only checking validation, nothing is saved.");
    await expect(save).toBeDisabled();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe.serial("listing lifecycle", () => {
  test.afterAll(async ({ browser, baseURL }) => {
    //* Cleanup: remove every E2E listing this account owns (including leftovers from failed runs). Seeded pets are never matched.
    const context = await browser.newContext({ storageState: storageState("shelter"), baseURL });
    try {
      const page = await context.newPage();
      await page.goto("/dashboard/shelter/listings");
      const token = await page.evaluate(() => localStorage.getItem("accessToken"));
      if (!token) return;
      const headers = { Authorization: token };
      const res = await context.request.get(`${API_URL}/pets/mine?limit=100`, { headers });
      const body: any = await res.json();
      const items: any[] = body?.data?.items ?? body?.data ?? [];
      for (const pet of items.filter((p) => LISTING_PATTERN.test(p.name))) {
        await context.request.delete(`${API_URL}/pets/${pet.id}`, { headers });
      }
    } finally {
      await context.close();
    }
  });

  test("creates a draft listing with a unique name and shows it in the list", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    await page.getByRole("button", { name: "Add listing" }).click();
    const dialog = page.getByRole("dialog");
    await fillRequiredListingFields(page, LISTING_NAME);
    await dialog.getByRole("button", { name: "Save draft" }).click();
    //* The editor stays open on the new listing; close it and look at the table
    await expect(dialog.getByRole("tab", { name: "Photos & video" })).toHaveAttribute("aria-selected", "true");
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    const row = page.getByRole("row").filter({ hasText: LISTING_NAME });
    await expect(row).toHaveCount(1);
    await expect(row.getByText("DRAFT", { exact: true })).toBeVisible();
  });

  test("edit dialog opens with the saved values and closes without changes", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    await page.getByRole("button", { name: `Edit ${LISTING_NAME}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: `Edit ${LISTING_NAME}` })).toBeVisible();
    await expect(dialog.getByLabel(/^Pet name/)).toHaveValue(LISTING_NAME);
    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();
  });

  test("publishes the test draft and pauses it again (status change only on the test listing)", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    const limitText = await page.getByText(/^Free plan: \d+ of \d+ active listings used$/).textContent();
    const [, used, limit] = limitText!.match(/(\d+) of (\d+)/)!.map(Number);
    test.skip(used >= limit, "Shelter is at its plan limit; publishing would be refused");

    await page.getByRole("button", { name: `Publish ${LISTING_NAME}` }).click();
    let row = page.getByRole("row").filter({ hasText: LISTING_NAME });
    await expect(row.getByText("PUBLISHED", { exact: true })).toBeVisible();

    await row.getByRole("button", { name: `Pause ${LISTING_NAME}` }).click();
    row = page.getByRole("row").filter({ hasText: LISTING_NAME });
    await expect(row.getByText("PAUSED", { exact: true })).toBeVisible();
  });

  //* BUG: My listings has no delete control (the API exists: DELETE /pets/:petId in server/src/app/modules/pet/pet.routes.ts).
  //* Remove this fixme once a delete action is added to src/app/(withDashboardLayout)/dashboard/shelter/listings/page.tsx.
  test.fixme("shelter can delete a listing from My listings", async ({ page }) => {
    await page.goto("/dashboard/shelter/listings");
    await page.getByRole("button", { name: `Delete ${LISTING_NAME}` }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: LISTING_NAME })).toHaveCount(0);
  });
});

test.describe("shelter operations pages", () => {
  test("applications shows the status filter and either applications or the empty state", async ({ page }) => {
    await page.goto("/dashboard/shelter/applications");
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
    await expect(page.getByRole("radiogroup", { name: "Filter by status" })).toBeVisible();
    await expect(page.getByText("Could not load this data.")).toHaveCount(0);
  });

  test("visits lists the upcoming/past toggle and the weekly availability settings", async ({ page }) => {
    await page.goto("/dashboard/shelter/visits");
    await expect(page.getByRole("heading", { name: "Visits" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visit requests" })).toBeVisible();

    const toggle = page.getByRole("radiogroup", { name: "Show" });
    await toggle.getByRole("radio", { name: "Past" }).click();
    await expect(toggle.getByRole("radio", { name: "Past" })).toHaveAttribute("aria-checked", "true");
    await toggle.getByRole("radio", { name: "Upcoming" }).click();

    await expect(page.getByRole("heading", { name: "Weekly availability" })).toBeVisible();
    await expect(page.getByLabel("Visitors per slot")).toBeVisible();
    //* Availability is viewed only; Save is not clicked
  });

  test("success stories shows the story form and either stories or the empty state", async ({ page }) => {
    await page.goto("/dashboard/shelter/stories");
    await expect(page.getByRole("heading", { name: "Success stories" })).toBeVisible();
    await expect(page.getByLabel(/^Title/)).toBeVisible();
    await expect(page.getByLabel(/^The story/)).toBeVisible();
    await expect(page.getByText("Could not load this data.")).toHaveCount(0);
  });

  test("messages inbox renders without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/dashboard/shelter/messages");
    await expect(page.getByRole("heading").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("shelter account pages", () => {
  test("team page shows seat usage and the add-by-email form without sending an invite", async ({ page }) => {
    await page.goto("/dashboard/shelter/members");
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
    await expect(page.getByText(/seats used\./)).toBeVisible();
    await expect(page.getByLabel("Add by email")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add", exact: true })).toBeVisible();
  });

  test("plan and billing shows the Free plan as current, with plan options and no checkout started", async ({ page }) => {
    await page.goto("/dashboard/shelter/billing");
    await expect(page.getByRole("heading", { name: "Plan & billing" })).toBeVisible();
    await expect(page.getByText("Current usage: Free")).toBeVisible();
    await expect(page.getByText(/^Active listings: \d+ of \d+$/)).toBeVisible();
    await expect(page.getByText(/^Team seats: \d+ of \d+$/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Free", exact: true })).toBeVisible();
    await expect(page.getByText("Current", { exact: true })).toBeVisible();
    //* Plan buttons (Upgrade / Manage billing) redirect to Stripe, so they are never clicked here
    await expect(page).toHaveURL(/\/dashboard\/shelter\/billing$/);
  });

  test("profile page shows the shelter account name, role and email", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page.getByText(accounts.shelter.email, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(accounts.shelter.name, { exact: false }).first()).toBeVisible();
  });
});
