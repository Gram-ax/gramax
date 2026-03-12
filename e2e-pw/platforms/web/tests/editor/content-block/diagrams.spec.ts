import { expect } from "@playwright/test";
import { sleep } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Diagrams", () => {
	editorTest("mermaid", async ({ editor, basePage, sharedPage }) => {
		await editor.hoverToolbar("diagrams");
		await sharedPage.getByRole("menuitem", { name: "Mermaid" }).click();

		const diagram = sharedPage.locator('[data-qa="qa-diagram-data"]');

		await expect(diagram).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();

		await sleep(1000);

		await sharedPage.goBack();
		await sharedPage.goForward();
		await basePage.waitForLoad();

		await expect(diagram).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();
	});

	editorTest("openapi", async ({ editor, basePage, sharedPage }) => {
		await editor.hoverToolbar("diagrams");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		const diagram = sharedPage.locator('[data-qa="qa-open-api"]');

		await expect(diagram).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();

		await sleep(1000);

		await sharedPage.goBack();
		await sharedPage.goForward();
		await basePage.waitForLoad();

		await expect(diagram).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();
	});
});
