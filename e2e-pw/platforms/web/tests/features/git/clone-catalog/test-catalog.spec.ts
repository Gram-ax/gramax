import { expect } from "@playwright/test";
import { getSourceDataFromEnv, getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";

test.use({});

const source = getSourceDataFromEnv();
const repo = getTestRepoInfoFromEnv();

test.describe
	.serial("test-catalog", () => {
		test("clone", async ({ homePage, sharedPage }) => {
			await sharedPage.getByTestId("add-catalog").click();

			await sharedPage.getByRole("menuitem", { name: "Load existing" }).click();

			await sharedPage.getByRole("combobox").click();
			await sharedPage.getByRole("option", { name: "GitLab" }).click({ force: true });

			await sharedPage.getByRole("textbox", { name: "GitLab Server URL" }).fill(source.domain);

			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).click();
			await sharedPage.getByRole("textbox", { name: "GitLab Token" }).fill(source.token);

			await expect(sharedPage.getByRole("textbox", { name: "Email" })).toHaveValue(source.userEmail);

			await sharedPage.getByRole("button", { name: "Add" }).click();
			await sharedPage.getByRole("combobox", { name: "Repository" }).click();

			await sharedPage.getByPlaceholder("Find").fill("test-catalog");
			await homePage.waitForLoad();

			await sharedPage.getByRole("option", { name: `${repo.group}/${repo.testRepo}` }).click({ timeout: 15_000 });

			await sharedPage.getByRole("button", { name: "Load" }).click();

			await homePage.waitForLoad(1000);

			await sharedPage.getByRole("button", { name: "Автотест" }).click();

			await homePage.waitForLoad(1000);

			await sharedPage.getByRole("link", { name: "Автотест" }).click();
		});

		test("switch versions", async ({ basePage }) => {
			const page = basePage.raw;

			await page.getByRole("button", { name: "Автотест" }).click();
			await basePage.waitForLoad();

			// master -> Z
			await page.getByRole("complementary").getByText("master").click();
			await page.getByRole("menuitemradio", { name: "Z" }).click();
			await basePage.waitForLoad();
			await basePage.assertNoModal();
			expect(basePage.url).toContain("/test-catalog:Z");

			// Navigate to "Тег" article
			await page.getByRole("link", { name: "Тег" }).click();
			await basePage.waitForLoad();
			await basePage.assertNoModal();
			expect(basePage.url).toContain("/test-catalog:Z/teg");

			// Z -> x (branch without this article - expect error)
			await page.getByRole("complementary").getByText("Z").click();
			await page.getByRole("menuitemradio", { name: "x" }).click();
			await basePage.waitForLoad();
			await expect(page.getByText("Check that the path is correct")).toBeVisible();
			expect(basePage.url).toContain("/test-catalog:x/teg");

			// x -> test/g
			await page.getByRole("complementary").getByText("x", { exact: true }).click();
			await page.getByRole("menuitemradio", { name: "test/g" }).click();
			await basePage.waitForLoad();
			await basePage.assertNoModal();

			// test/g -> master (back to current branch)
			await page.getByRole("complementary").getByText("test/g").click();
			await page.getByRole("menuitemradio", { name: "master" }).click();
			await basePage.waitForLoad();
			await basePage.assertNoModal();
			expect(basePage.url).not.toContain(":");
		});
	});
