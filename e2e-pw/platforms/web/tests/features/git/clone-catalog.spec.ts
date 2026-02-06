import { expect } from "@playwright/test";
import { getSourceDataFromEnv, getTestRepoInfoFromEnv } from "@utils/source";
import { homeTest as test } from "@web/fixtures/home.fixture";

test.use({});

const source = getSourceDataFromEnv();
const repo = getTestRepoInfoFromEnv();

test.describe("basic git", () => {
	test("clone", async ({ homePage, sharedPage }) => {
		await sharedPage.getByTestId("add-catalog").click();

		await sharedPage.getByRole("menuitem", { name: "Load existing" }).click();

		await sharedPage.getByRole("combobox").click();
		await sharedPage.getByRole("option", { name: "GitLab" }).click();

		await sharedPage.getByRole("textbox", { name: "GitLab Server URL" }).fill(source.domain);

		await sharedPage.getByRole("textbox", { name: "GitLab Token" }).click();
		await sharedPage.getByRole("textbox", { name: "GitLab Token" }).fill(source.token);

		await expect(sharedPage.getByRole("textbox", { name: "Email" })).toHaveValue(source.userEmail);

		await sharedPage.getByRole("button", { name: "Add" }).click();
		await sharedPage.getByRole("combobox", { name: "Repository" }).click();

		await sharedPage.getByPlaceholder("Find").fill("test-catalog");
		await homePage.waitForLoad();

		await sharedPage.getByRole("option", { name: `${repo.group}/${repo.testRepo}` }).click();

		await sharedPage.getByRole("button", { name: "Load" }).click();

		await homePage.waitForLoad();

		await sharedPage.getByRole("button", { name: "Автотест Для автотестирования" }).click();
		await sharedPage.getByRole("link", { name: "test-catalog Автотест" }).click();
	});
});
