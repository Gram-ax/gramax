import { homeTest } from "@web/fixtures/home.fixture";
import { expect, type Page } from "playwright/test";

homeTest.use({});

const openUserMenu = async (page: Page) => {
	const trigger = page.getByTestId("top-menu").getByRole("button").last();
	await expect(trigger).toBeVisible({ timeout: 10000 });
	await trigger.click({ force: true });
};

const openSettings = async (page: Page) => {
	await openUserMenu(page);
	await page.getByRole("menuitem", { name: /^(Settings|Настройки)$/ }).click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	return dialog;
};

const saveSettings = async (page: Page) => {
	await page.getByRole("button", { name: /^(Save|Сохранить)$/ }).click();
	await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10000 });
};

homeTest.describe("Top Bar", () => {
	homeTest.describe.configure({ mode: "serial" });

	homeTest("open and close 'Add catalog' dropdown", async ({ homePage }) => {
		const dropdown = await homePage.topBar.getAddCatalog();
		await dropdown.open();

		dropdown.assertHasItems([
			{
				title: "Create new catalog",
				description: "Stored locally until first publication",
				hasSubContent: false,
			},
			{ title: "Load existing", description: "From GitHub, GitLab or other storage", hasSubContent: false },
			{
				title: "Import from another system",
				description: "From Confluence or Notion",
				hasSubContent: false,
			},
		]);

		await dropdown.close();

		expect(await dropdown.isOpen()).toBe(false);
	});

	homeTest("open and close 'Switch workspace' dropdown", async ({ homePage }) => {
		const [workspace, dropdown] = await homePage.topBar.getSwitchWorkspace();
		await dropdown.open();

		dropdown.assertHasItems([{ title: "Test Space" }, { title: "Add space" }]);

		await workspace.assertWorkspaces([{ name: "Test Space", icon: "layers" }]);
		await workspace.assertCurrentWorkspace({ name: "Test Space", icon: "layers" });

		await dropdown.close();
		expect(await dropdown.isOpen()).toBe(false);
	});

	homeTest("switch theme", async ({ sharedPage, homePage }) => {
		await homePage.topBar.assertVisible();

		let dialog = await openSettings(sharedPage);
		await dialog.locator("main").getByRole("combobox").nth(1).click();
		await sharedPage.getByRole("option", { name: "Dark" }).click();
		await saveSettings(sharedPage);

		await expect(sharedPage.locator("html")).toHaveClass(/dark/);

		dialog = await openSettings(sharedPage);
		await dialog.locator("main").getByRole("combobox").nth(1).click();
		await sharedPage.getByRole("option", { name: "Light" }).click();
		await saveSettings(sharedPage);

		await expect(sharedPage.locator("html")).not.toHaveClass(/dark/);
	});

	homeTest("switch language", async ({ sharedPage, homePage }) => {
		await homePage.topBar.assertVisible();

		let dialog = await openSettings(sharedPage);
		await dialog.locator("main").getByRole("combobox").first().click();
		await sharedPage.getByRole("option", { name: "Русский" }).click();
		await saveSettings(sharedPage);

		await openUserMenu(sharedPage);
		const settingsItem = sharedPage.getByRole("menuitem", { name: "Настройки" });
		await expect(settingsItem).toBeVisible();
		await settingsItem.click();
		await expect(sharedPage.getByRole("dialog")).toBeVisible();

		dialog = sharedPage.getByRole("dialog");
		await dialog.locator("main").getByRole("combobox").first().click();
		await sharedPage.getByRole("option", { name: "English" }).click();
		await saveSettings(sharedPage);

		await openUserMenu(sharedPage);
		await expect(sharedPage.getByRole("menuitem", { name: "Settings" })).toBeVisible();
		await sharedPage.keyboard.press("Escape");
	});
});
