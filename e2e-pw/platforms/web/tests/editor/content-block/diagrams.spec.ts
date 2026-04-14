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

	editorTest("clear mermaid content doesn't throw error", async ({ editor, basePage, sharedPage }) => {
		await editor.hoverToolbar("diagrams");
		await sharedPage.getByRole("menuitem", { name: "PlantUML" }).click();

		const diagram = sharedPage.locator('[data-qa="qa-diagram-data"]');

		await expect(diagram).toBeVisible();
		await expect(basePage.modal).not.toBeVisible();

		const mermaidEditor = sharedPage.locator(".node-diagrams");
		await expect(mermaidEditor).toBeVisible();
		await mermaidEditor.hover();

		const mermaidActions = mermaidEditor.locator('[data-qa="qa-node-actions"]');
		await expect(mermaidActions).toBeVisible();

		const pencilIcon = mermaidActions.getByTestId("edit-diagram");
		await expect(pencilIcon).toBeVisible();
		await pencilIcon.click();

		await expect(basePage.modal).toBeVisible();

		const monacoEditor = basePage.modal.getByRole("code");
		await expect(monacoEditor).toBeVisible();

		const monacoTextarea = basePage.modal.locator(".inputarea.monaco-mouse-cursor-text");
		await monacoEditor.click();
		await monacoTextarea.press("ControlOrMeta+A");
		await monacoTextarea.press("Backspace");

		await expect(monacoEditor).toBeVisible();
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
