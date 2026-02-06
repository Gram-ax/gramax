import { baseTest as test } from "@docportal/fixtures/base.fixture";
import { expect } from "@playwright/test";
import { getTestRepoInfoFromEnv } from "@utils/source";

test.use({ source: "env", user: "env" });

const repo = getTestRepoInfoFromEnv();

const catalogs = [
	{ name: "test-catalog", repoName: repo.testRepo, expectedButton: "Автотест" },
	{ name: "test-catalog-no-index", repoName: repo.testRepoNoIndex, expectedButton: "No Index" },
];

test.describe("prepare tests: clone required test catalogs", () => {
	for (const { name, repoName, expectedButton } of catalogs) {
		test(name, async ({ basePage }) => {
			const page = basePage.raw;

			if (await page.getByRole("button", { name: expectedButton }).isVisible()) {
				return;
			}

			await page.getByTestId("add-catalog").click();
			await page.getByRole("menuitem", { name: "Load existing" }).click();

			await page.getByRole("combobox").click();
			await page.getByRole("option", { name: "GitLab" }).click();

			await page.getByRole("combobox", { name: "Repository" }).click();
			await page.getByPlaceholder("Find").fill("test-catalog");
			await basePage.waitForLoad();

			await page.getByRole("option", { name: `${repo.group}/${repoName}` }).click();
			await page.getByRole("button", { name: "Load" }).click();

			await basePage.waitForLoad();

			await expect(page.getByRole("button", { name: expectedButton })).toBeVisible();
		});
	}
});
