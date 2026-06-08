import { Select } from "@shared-pom/select";
import { catalogTest } from "@web/fixtures/catalog.fixture";
import { expect } from "playwright/test";

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

catalogTest.describe("Managing catalog properties", () => {
	catalogTest("create new property type flag", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const catalogProperties = await catalogPage.getCatalogProperties();
		await catalogProperties.open();

		const addButton = await catalogProperties.findItemByTitle("Add property");
		await addButton.click();

		await expect(catalogPage.modal.getByText("New property")).toBeVisible();

		const nameInput = catalogPage.modal.getByRole("textbox", { name: "Name" });
		await nameInput.fill("Test Flag");

		const typeSelect = new Select(
			sharedPage,
			catalogPage.modal.getByRole("combobox").filter({ hasText: "Select a type" }),
		);

		await typeSelect.open();
		const flagItem = await typeSelect.findItemByTitle("Flag");
		await flagItem.click();

		const styleSelect = new Select(
			sharedPage,
			catalogPage.modal.getByRole("combobox").filter({ hasText: "Select a style" }),
		);

		await styleSelect.open();
		const redItem = await styleSelect.findItemByTitle("Red");
		await redItem.click();

		const saveButton = catalogPage.modal.getByRole("button", { name: "Add" });
		await saveButton.click();

		await expect(catalogPage.modal.getByText("New property")).toBeHidden();
		await catalogPage.waitForLoad();

		const props = await catalogPage.catalog("test-catalog").props();
		expect(props).toMatchObject({
			properties: expect.arrayContaining([
				expect.objectContaining({ name: "Test Flag", type: "Flag", style: "red" }),
			]),
		});
	});

	catalogTest("create new property type enum", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const catalogProperties = await catalogPage.getCatalogProperties();
		await catalogProperties.open();

		const addButton = await catalogProperties.findItemByTitle("Add property");
		await addButton.click();

		await expect(catalogPage.modal.getByText("New property")).toBeVisible();

		const nameInput = catalogPage.modal.getByRole("textbox", { name: "Name" });
		await nameInput.fill("Test Enum");

		const typeSelect = new Select(
			sharedPage,
			catalogPage.modal.getByRole("combobox").filter({ hasText: "Select a type" }),
		);

		await typeSelect.open();
		const enumItem = await typeSelect.findItemByTitle("One from the list");
		await enumItem.click();

		const styleSelect = new Select(
			sharedPage,
			catalogPage.modal.getByRole("combobox").filter({ hasText: "Select a style" }),
		);

		await styleSelect.open();
		const blueItem = await styleSelect.findItemByTitle("Blue");
		await blueItem.click();

		const addValueButton = catalogPage.modal.getByTestId("add-value");
		await addValueButton.click();

		const firstValueRow = catalogPage.modal.getByTestId("value-row").first();
		await firstValueRow.locator("input").fill("SY");

		const saveButton = catalogPage.modal.getByRole("button", { name: "Add" });
		await saveButton.click();

		await expect(catalogPage.modal.getByText("New property")).toBeHidden();
		await catalogPage.waitForLoad();

		const props = await catalogPage.catalog("test-catalog").props();
		expect(props).toMatchObject({
			properties: expect.arrayContaining([
				expect.objectContaining({ name: "Test Enum", type: "Enum", style: "blue", values: ["SY"] }),
			]),
		});
	});

	catalogTest("add enum property value to article", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const articleProperties = await catalogPage.getCatalogProperties();
		await articleProperties.open();

		const assigneeItem = await articleProperties.findItemByTitle("Assignee");
		await assigneeItem.hover();

		const syItem = catalogPage.page.getByRole("menuitem", { name: "SY" });
		await syItem.click();

		await expect(sharedPage.getByTestId("property-tag").filter({ hasText: "SY" })).toBeVisible();
	});

	catalogTest("add flag property to article", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const articleProperties = await catalogPage.getCatalogProperties();
		await articleProperties.open();

		const importantItem = await articleProperties.findItemByTitle("Important");
		await importantItem.click();

		await expect(sharedPage.getByTestId("property-tag").filter({ hasText: "Important" })).toBeVisible();
	});

	catalogTest("remove flag property from article", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const articleProperties = await catalogPage.getCatalogProperties();
		await articleProperties.open();
		const importantItemAdd = await articleProperties.findItemByTitle("Important");
		await importantItemAdd.click();

		await expect(sharedPage.getByTestId("property-tag").filter({ hasText: "Important" })).toBeVisible();
		await sharedPage.keyboard.press("Escape");

		const articleProperties2 = await catalogPage.getCatalogProperties();
		await articleProperties2.open();
		const importantItem = await articleProperties2.findItemByTitle("Important");
		await importantItem.click();
		await sharedPage.keyboard.press("Escape");

		await expect(sharedPage.getByTestId("property-tag").filter({ hasText: "Important" })).toBeHidden();
	});

	catalogTest("delete property from catalog", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		const catalogProperties = await catalogPage.getCatalogProperties();
		await catalogProperties.open();

		const importantItem = await catalogProperties.findItemByTitle("Important");
		await importantItem.raw.locator.getByRole("button").click();

		await expect(catalogPage.modal.getByText("Edit property")).toBeVisible();

		const deleteButton = catalogPage.modal.getByRole("button", { name: "Delete" });
		await deleteButton.click();

		const continueButton = sharedPage.getByRole("button", { name: "Continue" });
		await continueButton.click();

		await catalogPage.waitForLoad();

		const props = await catalogPage.catalog("test-catalog").props();
		const names = (props.properties ?? []).map((p: { name: string }) => p.name);
		expect(names).not.toContain("Important");
		expect(names).toContain("Assignee");
	});
});
