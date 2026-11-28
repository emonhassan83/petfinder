import { expect, test as base } from "@playwright/test";
import { API_URL } from "./fixtures/roles";

//* Signed-out (public) UI tests for the (withCommonLayout) pages and the login/register forms.
//* Every test also fails if the page throws an uncaught error (see the `errors` fixture).
const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await use(errors);
    expect(errors, "uncaught page errors").toEqual([]);
  },
});

test.describe("home", () => {
  test("hero shows the adopt headline and the audience switch changes copy and CTA", async ({ page, errors }) => {
    await page.goto("/");
    const headline = page.getByRole("heading", { level: 1 });
    await expect(headline).toContainText("Find the friend who");
    await expect(page.getByRole("radio", { name: "I want to adopt" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("link", { name: "Find a pet" }).first()).toHaveAttribute("href", "/pets");

    await page.getByRole("radio", { name: "I'm rehoming a pet" }).click();
    await expect(headline).toContainText("Give your pet a");
    await expect(page.getByRole("radio", { name: "I'm rehoming a pet" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("link", { name: "List a pet" }).first()).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
  });

  test("hero search card sends location and pet type to /pets", async ({ page, errors }) => {
    await page.goto("/");
    const search = page.getByRole("search");
    await search.getByLabel("Location").fill("Dhaka");
    await search.getByRole("combobox", { name: "Type of pet" }).click();
    await page.getByRole("option", { name: "Cat" }).click();
    await search.getByRole("button", { name: "Search" }).click();

    await page.waitForURL((url) => url.pathname === "/pets");
    const params = new URL(page.url()).searchParams;
    expect(params.get("searchTerm")).toBe("Dhaka");
    expect(params.get("species")).toBe("Cat");
  });

  test("top navigation reaches the main public sections", async ({ page, errors }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Shelters & Rescues" }).first().click();
    await page.waitForURL((url) => url.pathname === "/shelters");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Shelters");

    await page.getByRole("link", { name: "About" }).first().click();
    await page.waitForURL((url) => url.pathname === "/about-us");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("loving home");
  });
});

test.describe("pets", () => {
  test("pet cards render with a result count", async ({ page, errors }) => {
    await page.goto("/pets");
    //* The card link wraps an absolutely positioned image, so the anchor itself has no box; assert on the image
    await expect(page.getByRole("img", { name: /.+/ }).first()).toBeVisible();
    await expect(page.getByText(/\d+ pets? found/)).toBeVisible();
  });

  test("a species filter narrows the results", async ({ page, errors }) => {
    await page.goto("/pets");
    await expect(page.getByText(/\d+ pets? found/)).toBeVisible();

    //* Picking "Cats" re-queries the API with species=Cat; the header count must reflect that response's total
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/pets?") && res.url().includes("species=Cat")),
      page.getByRole("tab", { name: "Cats" }).click(),
    ]);
    const total = (await response.json()).meta.total as number;
    await expect(page.getByRole("tab", { name: "Cats" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(`${total} ${total === 1 ? "pet" : "pets"} found`)).toBeVisible();
  });

  test("opening a pet shows its key facts", async ({ page, errors }) => {
    await page.goto("/pets");
    const card = page.getByRole("link", { name: /^View / }).first();
    const label = (await card.getAttribute("aria-label")) ?? "";
    const name = label.replace(/^View /, "");
    await card.locator("img").click();

    await page.waitForURL(/\/pets\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
    await expect(page.getByText("Breed", { exact: true })).toBeVisible();
    await expect(page.getByText("Age", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  });

  test("signed-out visitors are sent to log in to save or apply", async ({ page, errors }) => {
    await page.goto("/pets");
    await page.getByRole("button", { name: "Save to favorites" }).first().click();
    await expect(page.getByText("Log in to save pets")).toBeVisible();
    await page.waitForURL((url) => url.pathname === "/login");
    expect(new URL(page.url()).searchParams.get("redirect")).toBe("/pets");
  });

  test("pet detail: apply button asks to log in", async ({ page, errors }) => {
    await page.goto("/pets");
    await page.getByRole("link", { name: /^View / }).first().locator("img").click();
    await page.waitForURL(/\/pets\/[^/]+$/);
    const petPath = new URL(page.url()).pathname;

    await page.getByRole("button", { name: "Log in to apply" }).click();
    await page.waitForURL((url) => url.pathname === "/login");
    expect(new URL(page.url()).searchParams.get("redirect")).toBe(petPath);
  });
});

test.describe("content pages", () => {
  test("shelters list links to a shelter profile", async ({ page, errors }) => {
    await page.goto("/shelters");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Shelters");
    await page.getByRole("link", { name: "Happy Paws Shelter" }).first().click();
    await page.waitForURL(/\/shelters\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Happy Paws Shelter");
  });

  test("stories list renders its filter and either stories or the empty state", async ({ page, errors }) => {
    await page.goto("/stories");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Happy tails from");
    await expect(page.getByRole("radio", { name: "All stories" })).toBeChecked();
    //* The dev API may have no published stories; the story detail page is covered once data exists
    await expect(page.getByText("No stories in this category yet.").or(page.getByRole("link", { name: /^Read .+ story$/ }).first())).toBeVisible();
  });

  test("resources page renders its heading", async ({ page, errors }) => {
    await page.goto("/blogs");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pet care &");
  });

  test("pricing page renders its plans heading", async ({ page, errors }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Simple plans");
  });

  test("donate page renders its heading", async ({ page, errors }) => {
    await page.goto("/donate");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Help a pet get their");
  });
});

test.describe("login", () => {
  test("invalid email and short password show validation messages and do not submit", async ({ page, errors }) => {
    await page.goto("/login");
    //* "a@b" passes the browser's type=email check but not zod's, so the form's own messages are exercised
    await page.getByLabel("Email").fill("a@b");
    await page.getByLabel("Password").fill("123");
    await page.locator("form button[type=submit]").click();

    await expect(page.getByText("Please enter a valid email address!")).toBeVisible();
    await expect(page.getByText("Must be at least 6 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("wrong password shows an error toast and stays on login", async ({ page, errors }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody-e2e@petfinder.test");
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.locator("form button[type=submit]").click();

    await expect(page.locator("[data-sonner-toast][data-type=error]")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("register", () => {
  test("empty form shows field validation messages", async ({ page, errors }) => {
    await page.goto("/register");
    await page.locator("form button[type=submit]").click();

    await expect(page.getByText("Please enter your name!")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address!")).toBeVisible();
    await expect(page.getByText("Please provide a valid phone number!")).toBeVisible();
    await expect(page.getByText("Please enter your address!")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test("account type toggle updates the hint text", async ({ page, errors }) => {
    await page.goto("/register");
    await expect(page.getByText("Find and adopt a pet")).toBeVisible();
    await page.getByRole("button", { name: "Shelter", exact: true }).click();
    await expect(page.getByText("List pets for your organisation")).toBeVisible();
  });

  test("mismatched passwords are rejected before any request is sent", async ({ page, errors }) => {
    await page.goto("/register");
    await page.getByLabel("Username").fill("E2E Mismatch");
    await page.getByLabel("Email").fill(`e2e-mismatch-${Date.now()}@petfinder.test`);
    await page.getByLabel("Contact No").fill("01712345678");
    await page.getByLabel("Password", { exact: true }).fill("abcdef12");
    await page.getByLabel("Confirm Password").fill("abcdef13");
    await page.getByLabel("Address").fill("Dhaka");
    await page.locator("form button[type=submit]").click();

    await expect(page.getByText("Password and Confirm Passwords do not match!")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});
