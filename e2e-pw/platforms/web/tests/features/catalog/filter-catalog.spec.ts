import { expect } from "@playwright/test";
import { Dropdown } from "@shared-pom/dropdown";
import { Select } from "@shared-pom/select";
import { catalogTest } from "@web/fixtures/catalog.fixture";

const testData = [
	{
		testName: "Flag",
		property: "Flag",
		expectFilterOptions: [{ title: "No filter" }, { title: "Has property: Flag" }],
		selectOption: "Has property: Flag",
		expectedFilterText: "Flag",
		expectedArticles: ["Filter: Flag"],
		visibleArticle: "Filter: Flag",
	},
	{
		testName: "EnumProp",
		property: "EnumProp",
		expectFilterOptions: [{ title: "No filter" }, { title: "One" }, { title: "Two" }],
		selectOption: "One",
		expectedFilterText: "One",
		expectedArticles: ["Filter: Enum"],
		visibleArticle: "Filter: Enum",
	},
	{
		testName: "ManyProp: 1",
		property: "ManyProp",
		expectFilterOptions: [{ title: "No filter" }, { title: "One" }, { title: "Two" }, { title: "Three" }],
		selectOption: "One",
		expectedFilterText: "One",
		expectedArticles: ["Filter: Many (exact)", "Filter: Many (one of few)"],
		visibleArticle: "Filter: Many (exact)",
	},
	{
		testName: "ManyProp: 2",
		property: "ManyProp",
		expectFilterOptions: [{ title: "No filter" }, { title: "One" }, { title: "Two" }, { title: "Three" }],
		selectOption: "Two",
		expectedFilterText: "Two",
		expectedArticles: ["Filter: Many (one of few)"],
		visibleArticle: "Filter: Many (one of few)",
	},
];

catalogTest.use({
	startUrl: "/test-catalog",
	experimentalFeatures: ["filtered-catalog"],
	dir: new URL("./filter-catalog", import.meta.url),
	isolated: true,
});

catalogTest.describe("Catalog Filter", () => {
	for (const data of testData) {
		catalogTest(data.testName, async ({ catalogPage, sharedPage }) => {
			const allProps = ["Flag", "EnumProp", "ManyProp"];
			const targetProperty = data.property;

			expect(allProps).toContain(targetProperty);

			const catalogActions = await catalogPage.getCatalogActions();
			await catalogActions.open();
			const item = await catalogActions.findItemByTitle("Configure catalog");
			await item.click();

			await expect(catalogPage.modal.getByText("Catalog Settings")).toBeVisible();

			const select = new Select(
				sharedPage,
				catalogPage.modal
					.getByRole("combobox")
					.filter({ hasText: "Select a property for filtering" }), // TODO: fix
			);
			await select.open();
			await select.assertHasItems(allProps.map((title) => ({ title })));

			const selectValue = await select.findItemByTitle(targetProperty);
			await selectValue.click();

			await expect(
				catalogPage.modal
					.getByRole("combobox")
					.filter({ hasText: targetProperty }), // TODO: fix
			).toBeVisible();

			await sharedPage.getByRole("button", { name: "Save" }).click();

			await expect(catalogPage.modal.getByText("Catalog Settings")).toBeHidden();

			const props = await catalogPage.catalog("test-catalog").props();
			expect(props).toMatchObject({ filterProperty: targetProperty });

			await expect(sharedPage.getByTitle("Filter:")).toHaveCount(4);

			const selectVersion = new Dropdown(sharedPage, sharedPage.getByText("Filter", { exact: true }));
			await selectVersion.open();
			await selectVersion.assertHasItems(data.expectFilterOptions);

			await selectVersion.findItemByTitle(data.selectOption).then((i) => i.click());
			await selectVersion.close();

			await expect(sharedPage.getByText(data.expectedFilterText, { exact: true })).toBeVisible();
			await expect(sharedPage.getByTitle("Filter:")).toHaveCount(data.expectedArticles.length);

			for (const article of data.expectedArticles) {
				const articleElement = sharedPage.getByTitle(article);
				await expect(articleElement).toBeVisible();
			}

			const visibleArticleElement = sharedPage.getByTitle(data.visibleArticle);
			await visibleArticleElement.click();
			await expect(sharedPage.getByRole("heading", { name: data.visibleArticle })).toBeVisible();

			await expect(sharedPage.getByText("Check that the path is correct")).not.toBeVisible();
		});
	}
});
