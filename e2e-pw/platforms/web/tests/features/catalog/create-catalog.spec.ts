import { homeTest } from "@web/fixtures/home.fixture";

homeTest.use({});

homeTest.describe("Create catalog", () => {
	homeTest.describe.configure({ mode: "serial" });

	homeTest("should create a new catalog", async ({ homePage }) => {
		await homePage.workspace.assertHasCatalogs([]);

		const addCatalogDropdown = await homePage.topBar.getAddCatalog();
		await addCatalogDropdown.open();
		await addCatalogDropdown.assertHasItem({ title: "Create new catalog" });

		const item = await addCatalogDropdown.findItemByTitle("Create new catalog")!;
		await item.click();

		await homePage.waitForLoad();

		homePage.assertUrl("/-/-/-/-/new-catalog");
		await homePage.workspace.assertHasCatalogs(["new-catalog"]);
	});
});
