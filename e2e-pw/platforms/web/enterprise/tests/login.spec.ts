import { expect } from "playwright/test";
import { enterpriseTest } from "../fixtures/enterprise.fixture";

enterpriseTest.use({
	experimentalFeatures: ["opentelemetry-logs"],
});

enterpriseTest.describe("SSO", () => {
	enterpriseTest("Login & Logout as workspaceOwner", async ({ creds, basePage, sharedPage: page }) => {
		const startUrl = page.url();

		await basePage.assertNoModal();

		await enterpriseTest.step("Log in", async () => {
			await expect(page.getByRole("button", { name: "Sign in with SSO" })).toBeVisible({ timeout: 20_000 });
			await page.getByRole("button", { name: "Sign in with SSO" }).click({ timeout: 20_000 });

			await page.waitForURL((url) => url.origin === creds.keycloakEndpointUrl);

			await page.getByRole("textbox", { name: "Username or email" }).fill(creds.workspaceOwner.email);
			await page.getByRole("textbox", { name: "Password" }).fill(creds.workspaceOwner.password);
			await page.getByRole("button", { name: "Sign In" }).click();

			await page.waitForURL(startUrl);

			await expect(page.getByTestId("top-menu").getByRole("button", { name: "W" })).toBeVisible();

			await basePage.waitForLoad(1000, 500);

			await basePage.assertNoModal();

			for (const catalogName of ["catalog-owner", "editor", "reader", "reviewer"]) {
				await expect(page.getByRole("button", { name: catalogName })).toBeVisible();
			}
		});

		await enterpriseTest.step("Log out", async () => {
			await page.getByTestId("top-menu").getByRole("button", { name: "W" }).click();
			await page.getByRole("menuitem", { name: "Sign out" }).click();

			await expect(page.getByRole("heading", { name: "Sign out of workspace «test»?" })).toBeVisible();

			await page.getByRole("button", { name: "Exit" }).click();
			await page.getByRole("button", { name: "Sign in with SSO" }).click({ timeout: 30_000 });
		});
	});
});
