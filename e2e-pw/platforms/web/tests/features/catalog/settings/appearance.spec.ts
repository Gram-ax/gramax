import { catalogTest } from "@web/fixtures/catalog.fixture";
import type CatalogPage from "@web/pom/catalog.page";
import path from "path";
import { expect, type Page } from "playwright/test";

const svgPath = path.join(new URL(".", import.meta.url).pathname, "fixtures/logo.svg");

catalogTest.use({
	startUrl: "/test-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

const openAppearanceSettings = async (catalogPage: CatalogPage) => {
	const catalogProperties = await catalogPage.getCatalogActions();
	await catalogProperties.open();

	await (await catalogProperties.findItemByTitle("Configure catalog"))!.click();

	await expect(catalogPage.modal.getByText("Catalog Settings", { exact: true })).toBeVisible();

	await expect(catalogPage.modal.locator("label:has-text('Logo')").first()).toBeVisible();
};

const openIconPicker = async (catalogPage: CatalogPage, sharedPage: Page) => {
	await catalogPage.modal.getByText("Icon / Emoji / Custom logo").first()!.click();

	await expect(sharedPage.getByRole("radio", { name: "Emoji" })).toBeVisible();
	await expect(sharedPage.getByText("Upload")).toBeVisible();
};

catalogTest.describe("Managing catalog appearance settings", () => {
	catalogTest("Set catalog logo as icon", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		await openAppearanceSettings(catalogPage);
		await openIconPicker(catalogPage, sharedPage);

		await sharedPage.locator(".group\\/menu-item:has(.lucide-baseline)")!.click();

		await sharedPage.keyboard.press("Escape");

		await catalogPage.modal.getByText("Save").click();
		await catalogPage.waitForLoad();

		const element = sharedPage.getByTestId("left-navigation-top");
		await expect(element).toBeVisible();

		const logo = element.locator(".lucide-baseline");
		await expect(logo).toBeVisible();
	});

	catalogTest("Set catalog logo as emoji", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		await openAppearanceSettings(catalogPage);
		await openIconPicker(catalogPage, sharedPage);

		await sharedPage.getByRole("radio", { name: "Emoji" }).click();
		await sharedPage.getByText("😁")!.click();

		await sharedPage.keyboard.press("Escape");

		await catalogPage.modal.getByText("Save").click();
		await catalogPage.waitForLoad();

		const element = sharedPage.getByTestId("left-navigation-top");
		await expect(element).toBeVisible();

		const logo = element.getByTestId("catalog-logo-emoji");
		await expect(logo).toBeVisible();
	});

	catalogTest("Set catalog logo as image", async ({ catalogPage, sharedPage }) => {
		await catalogPage.waitForLoad();

		await openAppearanceSettings(catalogPage);
		await openIconPicker(catalogPage, sharedPage);

		await sharedPage.getByText("Upload")!.click();
		await sharedPage.locator('input[type="file"]').setInputFiles([svgPath]);

		await catalogPage.modal.getByText("logo.svg").first()!.click();

		await catalogPage.modal.getByText("Save").click();
		await catalogPage.waitForLoad();

		const element = sharedPage.getByTestId("left-navigation-top");
		await expect(element).toBeVisible();

		const logo = element.getByTestId("catalog-logo-image");
		await expect(logo).toBeVisible();
	});
});
