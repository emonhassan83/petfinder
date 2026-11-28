import { expect, test, type Page } from "@playwright/test";
import { API_URL, accounts, storageState } from "./fixtures/roles";

//* UI tests for the USER (adopter) role. Runs against the dev DB; every write is undone before the test ends.
//* Route guards are covered in access-control.spec.ts and are not repeated here.

const USER_MENU = [
  { title: "Dashboard", href: "/dashboard/user" },
  { title: "Manage Adoption", href: "/dashboard/user/manage-adoption" },
  { title: "My Visits", href: "/dashboard/user/visits" },
  { title: "Saved Pets", href: "/dashboard/user/favorites" },
  { title: "Messages", href: "/dashboard/user/messages" },
  { title: "Notifications", href: "/dashboard/user/notifications" },
  { title: "Add Blog", href: "/dashboard/user/add-blog" },
  { title: "My Blogs", href: "/dashboard/user/my-blogs" },
  { title: "My Profile", href: "/dashboard/profile" },
];

//* Items that belong to other roles and must never appear for an adopter
const FOREIGN_MENU = [
  "Manage Users", "Add Pet", "Manage Pets", "Adoption Requests", "Manage Blogs",
  "Shelter Verification", "Reports", "Success Stories", "Subscriptions", "Lookups",
  "Content (CMS)", "Audit Logs", "Overview", "My Listings", "Applications", "Visits", "Team", "Plan & Billing",
];

//* Collects uncaught client-side exceptions for the whole test
const trackPageErrors = (page: Page) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

//* Removes every saved pet of the signed-in adopter through the API (token from the saved session's localStorage)
const clearFavorites = async (page: Page) => {
  await page.goto("/dashboard/user");
  const token = (await page.evaluate(() => localStorage.getItem("accessToken"))) ?? "";
  const headers = { Authorization: token };
  const res = await page.request.get(`${API_URL}/favorites/ids`, { headers });
  const ids: string[] = res.ok() ? (await res.json()).data ?? [] : [];
  for (const id of ids) await page.request.delete(`${API_URL}/favorites/${id}`, { headers });
};

const expectNoCrashScreen = async (page: Page) => {
  await expect(page.getByText(/Application error|Unhandled Runtime Error|Something went wrong/i)).toHaveCount(0);
};

test.describe("adopter dashboard", () => {
  test.use({ storageState: storageState("user") });

  test("sidebar shows exactly the USER menu and no other role's items", async ({ page }) => {
    await page.goto("/dashboard/user");
    for (const item of USER_MENU) {
      const link = page.getByRole("link", { name: item.title, exact: true });
      await expect(link, `menu item ${item.title}`).toBeVisible();
      await expect(link).toHaveAttribute("href", item.href);
    }
    for (const title of FOREIGN_MENU) {
      await expect(page.getByRole("link", { name: title, exact: true }), `foreign item ${title}`).toHaveCount(0);
    }
  });

  test("every sidebar item opens a page that renders without errors", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/user");
    for (const item of USER_MENU) {
      await page.getByRole("link", { name: item.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${item.href}$`));
      await expect(page.getByRole("link", { name: "My Profile", exact: true })).toBeVisible();
      await expectNoCrashScreen(page);
    }
    expect(errors).toEqual([]);
  });

  test("dashboard overview renders the adopter's profile", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/user");
    await expect(page.getByText(accounts.user.name).first()).toBeVisible();
    await expectNoCrashScreen(page);
    expect(errors).toEqual([]);
  });

  test("saving a pet from /pets shows it in Saved Pets and removing it leaves the list clean", async ({ page }) => {
    //* Start from an empty favorites list so leftovers from an aborted run can't fill every heart
    await clearFavorites(page);
    await page.goto("/pets");
    //* Pick a card whose heart is still empty so the test does not depend on earlier runs
    const freeHeart = page.getByRole("button", { name: "Save to favorites" }).first();
    await expect(freeHeart).toBeVisible();
    const freeCard = freeHeart.locator("xpath=ancestor::*[.//a[starts-with(@aria-label, 'View ')]][1]");
    //* The card link is zero-size in the listing, so it is matched by attribute rather than by role
    const petName = ((await freeCard.locator("a[aria-label^='View ']").first().getAttribute("aria-label")) ?? "").replace(/^View /, "");
    expect(petName).not.toBe("");

    //* Address the card by pet name: the heart's label flips on click, so a locator built from "Save to favorites" would move to another card
    const card = page
      .locator(`a[aria-label="View ${petName}"]`)
      .locator("xpath=ancestor::*[.//button[@aria-label='Save to favorites' or @aria-label='Remove from favorites']][1]");
    const heart = card.getByRole("button", { name: /(Save to|Remove from) favorites/ });

    try {
      //* Retry the click until the heart flips: the page can still be hydrating when the first click lands
      await expect(async () => {
        await heart.click();
        await expect(card.getByRole("button", { name: "Remove from favorites" })).toBeVisible({ timeout: 3_000 });
      }).toPass({ timeout: 30_000 });

      await page.goto("/dashboard/user/favorites");
      await expect(page.getByRole("heading", { name: "Saved pets" })).toBeVisible();
      await expect(page.getByRole("heading", { name: petName, exact: true })).toBeVisible();
    } finally {
      //* Clean up: remove the pet from Saved Pets if it is still there
      await page.goto("/dashboard/user/favorites");
      const remove = page.getByRole("button", { name: `Remove ${petName} from saved pets` });
      if (await remove.count()) {
        await remove.click();
        await expect(remove).toHaveCount(0);
      }
      //* Belt and braces: a retried heart click can leave a second favorite behind
      await clearFavorites(page);
    }
  });

  test("Manage Adoption shows the applications list or its empty state", async ({ page }) => {
    await page.goto("/dashboard/user/manage-adoption");
    await expect(page.getByRole("heading", { name: "My applications" })).toBeVisible();
    await expect(
      page.getByText("You haven't applied for a pet yet.").or(page.getByRole("grid"))
    ).toBeVisible();
    await expectNoCrashScreen(page);
  });

  test("My Visits shows both tabs and the matching empty state", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/user/visits");
    await expect(page.getByRole("tab", { name: /^Upcoming/ })).toBeVisible();

    await page.getByRole("tab", { name: /^Upcoming/ }).click();
    const upcomingEmpty = page.getByText("No upcoming visits. Book one from a pet's page.");
    if (await upcomingEmpty.count()) await expect(upcomingEmpty).toBeVisible();

    await page.getByRole("tab", { name: /^Past & cancelled/ }).click();
    const pastEmpty = page.getByText("No past visits yet.");
    if (await pastEmpty.count()) await expect(pastEmpty).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("Messages renders the inbox or its empty state", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/user/messages");
    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByText("No conversations yet").or(page.getByText(/No messages yet/).first())).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("Notifications renders the list or empty state for both filters", async ({ page }) => {
    await page.goto("/dashboard/user/notifications");
    await expect(page.getByRole("heading", { name: /Notifications/ })).toBeVisible();

    const filter = page.getByRole("group", { name: "Filter notifications" });
    await expect(filter).toBeVisible();
    await filter.getByRole("button", { name: "Unread" }).click();
    await expect(
      page.getByText("You're all caught up.").or(page.locator(".MuiCardActionArea-root").first())
    ).toBeVisible();

    await filter.getByRole("button", { name: "All" }).click();
    await expect(
      page.getByText("No notifications yet.").or(page.locator(".MuiCardActionArea-root").first())
    ).toBeVisible();
  });

  test("Add Blog stays on the form and does not submit when required fields are empty", async ({ page }) => {
    await page.goto("/dashboard/user/add-blog");
    await expect(page.getByLabel("Blog Name")).toBeVisible();
    await page.getByRole("button", { name: "Add A Blog" }).click();
    //* The server rejects the empty payload and a toast is shown; the page must not navigate away
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/user\/add-blog$/);
  });

  test("a new blog appears in My Blogs and can be deleted", async ({ page }) => {
    const title = `E2E blog ${Date.now()}`;
    const row = () => page.getByRole("row").filter({ hasText: title });
    const deleteButton = () => row().getByRole("button", { name: "delete", exact: true });
    try {
      await page.goto("/dashboard/user/add-blog");
      await page.getByLabel("Blog Name").fill(title);
      await page.getByLabel("Blog Image Url").fill("https://example.com/e2e-blog.jpg");
      await page.getByLabel("Blog Reference").fill("https://example.com/e2e");
      await page.getByLabel("Blog Tags").fill("e2e, adoption");
      await page.getByLabel("Blog Category").click();
      await page.getByRole("option", { name: "Adopting a Pet" }).click();
      await page.getByLabel("Blog Description").fill("Automated test blog, safe to delete.");
      await page.getByRole("button", { name: "Add A Blog" }).click();

      await expect(page).toHaveURL(/\/dashboard\/user\/my-blogs$/);
      await expect(row()).toBeVisible();

      await deleteButton().click();
      await expect(page.getByText("Blog deleted successfully!")).toBeVisible();
      await expect(row()).toHaveCount(0);
    } finally {
      //* Clean up if an assertion failed before the delete
      await page.goto("/dashboard/user/my-blogs");
      if (await row().count()) {
        await deleteButton().click();
        await expect(row()).toHaveCount(0);
      }
    }
  });

  test("Profile shows the adopter's name and email", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/dashboard/profile");
    await expect(page.getByText("Personal Information")).toBeVisible();
    await expect(page.getByText(accounts.user.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(accounts.user.email, { exact: true }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("editing the address on the profile saves and can be reverted", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await page.getByRole("button", { name: "Edit Profile" }).click();
    const dialog = page.getByRole("dialog");
    const address = dialog.getByLabel("Address", { exact: true });
    await expect(address).toBeVisible();
    const original = await address.inputValue();
    const edited = `E2E test address ${Date.now()}`;

    try {
      await address.fill(edited);
      await dialog.getByRole("button", { name: "Update" }).click();
      await expect(page.getByText("Profile updated successfully!")).toBeVisible();
      await expect(page.getByText(edited, { exact: true }).first()).toBeVisible();
    } finally {
      //* Revert the harmless field to its original value
      await page.goto("/dashboard/profile");
      await page.getByRole("button", { name: "Edit Profile" }).click();
      const restore = page.getByRole("dialog").getByLabel("Address", { exact: true });
      await restore.fill(original);
      await page.getByRole("dialog").getByRole("button", { name: "Update" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  });

  test("applying to a pet appears in Manage Adoption and can be withdrawn", async ({ page }) => {
    //* Only runs when Bella has no existing application, so an earlier run's leftovers are never withdrawn
    await page.goto("/dashboard/user/manage-adoption");
    await expect(page.getByRole("heading", { name: "My applications" })).toBeVisible();
    //* Wait for the list (grid or empty state) to load before deciding whether to skip
    await expect(page.getByRole("grid").or(page.getByText("You haven't applied for a pet yet."))).toBeVisible();
    //* Withdrawn applications stay in the list as history, so only an active application counts
    const existing = page.getByRole("row").filter({ hasText: "Bella" }).filter({ hasNotText: "WITHDRAWN" });
    test.skip(
      (await existing.count()) > 0,
      "an application for Bella already exists from an earlier run"
    );

    await page.goto("/pets");
    //* The card link is zero-size in the listing, so follow its href instead of clicking it
    const bellaHref = await page.locator("a[aria-label='View Bella']").first().getAttribute("href");
    expect(bellaHref).toMatch(/^\/pets\//);
    await page.goto(bellaHref!);
    await page.getByRole("button", { name: "Apply to Adopt" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Apply to Adopt")).toBeVisible();
    //* The server requires every select to be answered (YES/NO and sleeping place)
    await dialog.getByLabel("Are other pets neutered?").click();
    await page.getByRole("option", { name: "NO", exact: true }).click();
    await dialog.getByLabel("Do you have a secure outdoor area?").click();
    await page.getByRole("option", { name: "YES", exact: true }).click();
    await dialog.getByLabel("Where will the animal sleep at night?").click();
    await page.getByRole("option", { name: "Indoor", exact: true }).click();
    await dialog.getByLabel("Will the animal be left alone for long periods of time?").click();
    await page.getByRole("option", { name: "NO", exact: true }).click();
    await dialog.getByLabel("Details of other pets in household").fill("None");
    await dialog.getByLabel("Do you have any pet ownership experience?").fill("E2E test application");
    await dialog.getByLabel("Any other details to support your application?").fill("Automated test, will be withdrawn");
    await dialog.getByRole("button", { name: "Adoption Request" }).click();
    await expect(page.getByText(/Application sent!/)).toBeVisible();

    try {
      await page.goto("/dashboard/user/manage-adoption");
      await expect(page.getByRole("row").filter({ hasText: "Bella" })).toBeVisible();
    } finally {
      //* Clean up: withdraw the application created above
      await page.goto("/dashboard/user/manage-adoption");
      const row = page.getByRole("row").filter({ hasText: "Bella" });
      if (await row.count()) {
        await row.getByRole("button", { name: "Withdraw application" }).click();
        await page.getByRole("dialog").getByRole("button", { name: "Withdraw", exact: true }).click();
        await expect(page.getByText("Application withdrawn")).toBeVisible();
      }
    }
  });

  test("logout returns to a public page and the dashboard is no longer reachable", async ({ page }) => {
    await page.goto("/dashboard/user");
    await page.getByRole("button", { name: "Account settings" }).click();
    await page.getByRole("menuitem", { name: "Logout" }).click();
    await page.waitForURL((url) => url.pathname === "/");

    await page.goto("/dashboard/user");
    await page.waitForURL((url) => url.pathname === "/login");
  });
});
