import { homeTest } from "@web/fixtures/home.fixture";
import { expect } from "playwright/test";

homeTest.use({});

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

		dropdown.assertHasItems([{ title: "Default Workspace" }, { title: "Add workspace" }]);

		await workspace.assertWorkspaces([{ name: "Default Workspace", icon: "layers" }]);
		await workspace.assertCurrentWorkspace({ name: "Default Workspace", icon: "layers" });

		await dropdown.close();
		expect(await dropdown.isOpen()).toBe(false);
	});

	homeTest("switch theme", async ({ homePage }) => {
		const [theme, button] = await homePage.topBar.getSwitchTheme();

		await theme.assertHasTheme("light");

		await button.click();
		await theme.assertThemeChanged();

		await button.click();
		await theme.assertThemeChanged();
	});
});
