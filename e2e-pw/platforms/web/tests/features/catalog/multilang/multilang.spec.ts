import { expect } from "@playwright/test";
import { Select } from "@shared-pom/select";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.use({
	files: {
		untitled: {
			"untitled.md": "# New Article\n",
			"doc-root.yml": "title: New Catalog\n",
		},
	},
	startUrl: "/-/-/-/-/untitled/untitled",
	isolated: false,
	firstEnter: false,
});

editorTest.describe("Multilanguage", () => {
	editorTest.describe.configure({ mode: "serial" });

	editorTest("Sets Russian as catalog primary language", async ({ catalogPage, sharedPage }) => {
		await editorTest.step("Russian is set as catalog primary language", async () => {
			const actions = await catalogPage.getCatalogActions();
			await actions.open();
			const configureItem = await actions.findItemByTitle("Configure catalog");
			await configureItem.click();

			catalogPage.modal.getByText("Languages and Versions").click();

			const languageSelect = new Select(
				sharedPage,
				catalogPage.modal.getByRole("combobox").filter({ hasText: "English" }),
			);
			await languageSelect.open();
			const russianItem = await languageSelect.findItemByTitle("Русский");
			await russianItem.click();
			await catalogPage.modal.getByRole("button", { name: "Save" }).click();
			await catalogPage.waitForLoad();
		});

		await editorTest.step("language switcher shows Russian", async () => {
			await expect(sharedPage.locator('[data-qa="switch-content-language"]')).toContainText("Русский");
		});
	});

	editorTest("Adds English as second language from right panel", async ({ catalogPage, sharedPage }) => {
		await sharedPage.locator('[data-qa="switch-content-language"]').click();
		await sharedPage.getByText("Add language").click();
		await sharedPage.getByText("English").click();
		await catalogPage.waitForLoad();
		catalogPage.assertUrl("/-/-/-/-/untitled/en/untitled");
	});

	editorTest("Edits English article title and content", async ({ catalogPage, editor }) => {
		await catalogPage.goto("/-/-/-/-/untitled/en/untitled");
		await catalogPage.waitForLoad();
		await editor.setMarkdown("# test\n\nen");
		await catalogPage.waitForLoad();
		await editor.assertMarkdownContains("en");
	});

	editorTest("Switches to Russian language version", async ({ catalogPage, sharedPage, editor }) => {
		await editorTest.step("Russian article is open and editable", async () => {
			await sharedPage.locator('[data-qa="switch-content-language"]').click();
			await sharedPage.getByTestId("dropdown-content").getByText("Русский").click();
			await catalogPage.waitForLoad();
			catalogPage.assertUrl("/-/-/-/-/untitled/untitled");

			await editor.setMarkdown("# test\n\nru");
			await editor.assertMarkdownContains("ru");
		});
	});
});
