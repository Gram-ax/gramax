import { sleep } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";
import { expect } from "playwright/test";

editorTest.use({
	startUrl: "/template-catalog",
	dir: new URL(".", import.meta.url),
	isolated: true,
});

editorTest.describe("Templates", () => {
	editorTest("create new template", async ({ editor, sharedPage }) => {
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await expect(sharedPage.getByRole("menuitem", { name: "Templates" })).toBeVisible();

		await sharedPage.getByRole("menuitem", { name: "Templates" }).click();
		await sharedPage.getByRole("button", { name: "New template" }).click();
		await sharedPage.getByText("Untitled").first().click();

		await editorTest.step("fill template", async () => {
			await editor.type("My temporary template");
			await sleep(1000);
			await editor.press("Enter");
			await editor.type("template content");

			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "Variable" }).click();
			await sharedPage.getByRole("menuitem", { name: "Text block" }).click();
		});

		// 2 because has this text in templates list and in article
		await expect(sharedPage.getByText("My temporary template")).toHaveCount(2);

		await editor.forceSave();
	});

	editorTest("select and fill template for article", async ({ editor, sharedPage, catalogPage }) => {
		await sharedPage.getByTestId("article-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Choose template" }).click();

		await expect(sharedPage.getByRole("menuitem", { name: "My template" })).toBeVisible();

		await sharedPage.getByRole("menuitem", { name: "My template" }).click();
		await catalogPage.waitForLoad();

		await editor.assertMarkdownContains("Text block:");

		await sharedPage.getByTestId("inline-property").first().click();
		await sharedPage.getByRole("menuitemradio", { name: "Yes" }).first().click();
		await editor.press("Escape");
		await expect(sharedPage.getByTestId("inline-property").first()).toContainText("Yes");

		await sharedPage.getByTestId("inline-property").nth(1).click();
		await sharedPage.getByRole("menuitemradio", { name: "First" }).click();
		await editor.press("Escape");
		await expect(sharedPage.getByTestId("inline-property").nth(1)).toContainText("First");

		const blockProperty = await sharedPage.getByTestId("block-property");
		await blockProperty.click();
		await editor.focus();
		await editor.type("its content from text block");

		await editor.assertMarkdownContains("its content from text block");
		await editor.forceSave();

		const props = await catalogPage.currentArticleProps();
		expect(props).toMatchObject({
			properties: expect.arrayContaining([
				expect.objectContaining({ id: "t6hgk" }),
				expect.objectContaining({ id: "W1cZ2", value: ["First"] }),
				expect.objectContaining({ id: "HHkTb", value: ["its content from text block"] }),
			]),
		});

		await sharedPage.reload();
		await catalogPage.waitForLoad();

		await expect(sharedPage.getByText("its content from text block")).toHaveCount(1);
	});

	editorTest("delete template", async ({ sharedPage }) => {
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await sharedPage.getByRole("menuitem", { name: "Templates" }).click();
		await sharedPage.locator(".item-title", { hasText: "My template" }).hover();

		await sharedPage.getByRole("button", { name: "My template" }).getByRole("button").click();
		sharedPage.once("dialog", (dialog) => dialog.accept());
		await sharedPage.getByText("Delete").click();

		await expect(await sharedPage.getByRole("button", { name: "My template" }).getByRole("button")).toBeHidden();
	});
});
