import fs from "fs";
import path from "path";
import { expect, test as setup } from "@playwright/test";
import { API_URL, ROLES, accounts, storageState } from "./fixtures/roles";

//* Access tokens live 15 min; a session saved less than 10 min ago is reused so repeated runs don't hit the login rate limit
const FRESH_MS = 10 * 60 * 1000;
const isFresh = (file: string) => fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < FRESH_MS;

setup("adopter account exists", async ({ request }) => {
  const { email, password, name } = accounts.user;
  const res = await request.post(`${API_URL}/user/register`, {
    data: { name, email, password, contactNumber: "", address: "Dhaka", role: "USER" },
  });
  //* 409 = already registered on an earlier run
  expect([200, 201, 409]).toContain(res.status());
});

for (const role of ROLES) {
  setup(`sign in through the login form as ${role}`, async ({ page }) => {
    const file = storageState(role);
    if (isFresh(file)) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const { email, password, home } = accounts[role];
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator("form button[type=submit]").click();

    await page.waitForURL((url) => url.pathname === home, { timeout: 45_000 });
    await expect(page.locator("body")).toBeVisible();
    await page.context().storageState({ path: file });
  });
}
