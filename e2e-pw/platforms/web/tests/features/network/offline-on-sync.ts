import { expect } from "@playwright/test";
import { getSourceDataFromEnv, getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";

const source = getSourceDataFromEnv();
const repo = getTestRepoInfoFromEnv();

test.describe("Network", () => {
	test("sync switches status bar to offline state after clone when network is unavailable", async ({
		homePage,
		sharedPage,
	}) => {
		await sharedPage.getByTestId("add-catalog").click();
		await sharedPage.getByRole("menuitem", { name: "Load existing" }).click();
		await sharedPage.getByRole("combobox").click();
		await sharedPage.getByRole("option", { name: "GitLab" }).click();
		await sharedPage.getByRole("textbox", { name: "GitLab Server URL" }).fill(source.domain);
		await sharedPage.getByRole("textbox", { name: "GitLab Token" }).fill(source.token);
		await expect(sharedPage.getByRole("textbox", { name: "Email" })).toHaveValue(source.userEmail);

		const addButton = sharedPage.getByRole("button", { name: "Add" });
		await addButton.click();

		const repositoryCombobox = sharedPage.getByRole("combobox", { name: /Repository/i });

		await expect(repositoryCombobox).toBeVisible();

		await repositoryCombobox.click();
		await sharedPage.getByPlaceholder("Find").fill("test-catalog");
		await homePage.waitForLoad();

		await sharedPage.getByRole("option", { name: `${repo.group}/${repo.testRepo}` }).click({ timeout: 15_000 });

		await sharedPage.getByRole("button", { name: "Load" }).click();

		await homePage.waitForLoad(1000);

		await sharedPage.getByRole("button", { name: "Автотест" }).click();

		await homePage.waitForLoad();

		const firstArticle = sharedPage.locator('[data-qa="catalog-navigation-article-link-level-1"]').first();
		await expect(firstArticle).toBeVisible();
		await firstArticle.click();
		await homePage.waitForLoad();

		const articleStatusBar = sharedPage
			.locator('[data-qa="qa-status-bar"] .status-bar')
			.filter({ has: sharedPage.locator(".sync-icons:has(svg.lucide-refresh-cw)") })
			.first();

		await expect(articleStatusBar.locator("svg.lucide-wifi-off")).toHaveCount(0);

		const syncButton = articleStatusBar.locator(".sync-icons:has(svg.lucide-refresh-cw)");

		try {
			await sharedPage.context().setOffline(true);
			await sharedPage.waitForFunction(() => navigator.onLine === false);

			await syncButton.click();

			await expect(articleStatusBar.locator("svg.lucide-wifi-off")).toBeVisible();
			await expect(articleStatusBar).toHaveAttribute("data-state", "offline");
			await expect(articleStatusBar.locator(".sync-icons")).toHaveCount(2);
		} finally {
			await sharedPage.context().setOffline(false);
			await sharedPage.waitForFunction(() => navigator.onLine === true);
		}
	});
});
