import { expect } from "@playwright/test";
import { sleep } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Fragments (serial)", () => {
	editorTest.describe.configure({ mode: "serial" });

	editorTest.beforeEach(async () => {
		await sleep(1000);
	});

	editorTest("create & fill fragment", async ({ sharedPage, editor }) => {
		await editorTest.step("create fragment", async () => {
			await sharedPage.getByTestId("catalog-actions").click();
			await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
			await expect(sharedPage.getByRole("menuitem", { name: "Fragments" })).toBeVisible();
			await sharedPage.getByRole("menuitem", { name: "Fragments" }).click();
			await sharedPage.getByRole("button", { name: "New fragment" }).click();
			const fragmentsTab = sharedPage.locator("[data-qa='fragments-tab']");
			await expect(fragmentsTab).toBeVisible();
			await fragmentsTab.getByText("Untitled").first().click();
		});

		await editorTest.step("fill fragment", async () => {
			await editor.type("Test Fragment");
			await editor.press("Enter");
			await editor.type("fragment content");
			await editor.press("Enter");
			await editor.clickToolbar("headers");
			await sharedPage.getByRole("menuitem", { name: "Heading 2" }).click();
			await editor.type("Fragment Heading");
		});

		await editor.forceSave();
		await sleep(1000);
		await expect(sharedPage.getByText("Test Fragment")).toHaveCount(2);
	});

	editorTest("insert fragment into article", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "Fragments" }).hover();
		await expect(sharedPage.getByRole("option", { name: "Test Fragment" })).toBeVisible();
		await sharedPage.getByRole("option", { name: "Test Fragment" }).click();
		await editor.assertMarkdownContains(/<fragment id=".+"\/>/);
	});

	editorTest("delete fragment", async ({ sharedPage }) => {
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await sharedPage.getByRole("menuitem", { name: "Fragments" }).click();
		await sharedPage.locator(".item-title", { hasText: "Test Fragment" }).hover();
		await sharedPage.getByRole("button", { name: "Test Fragment" }).getByRole("button").click();
		await sharedPage.getByText("Delete").click();
		await sharedPage.getByRole("button", { name: "Continue" }).click();
	});

	editorTest("verify fragment deleted", async ({ sharedPage }) => {
		await sharedPage.reload();
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await sharedPage.getByRole("menuitem", { name: "Fragments" }).click();
		await sharedPage.getByText("No fragments in the current catalog").waitFor();
	});
});
