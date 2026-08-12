import { expect } from "@playwright/test";
import { resizerTest } from "@web/tests/editor/content-block/resizer.spec/resizer.fixture";

resizerTest.describe("Resizer — Drawio diagram", () => {
	resizerTest("resizer appears when drawio is selected", async ({ sharedPage, editor, resizer }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "Diagrams.net" }).click();

		const diagram = sharedPage.getByTestId("drawio");
		await expect(diagram).toBeVisible();

		await expect(resizer).toHaveAttribute("aria-hidden", "false");
	});

	resizerTest(
		"drag resizer on drawio saves updated scale to markdown",
		async ({ editor, sharedPage, resizer, dragResizer }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "Diagrams.net" }).click();

			await expect(resizer).toHaveAttribute("aria-hidden", "false");
			await expect(sharedPage.locator(".drawio img")).toBeVisible();

			await dragResizer(60);
			await editor.forceSave();

			await editor.assertMarkdownContains(/scale="\d+px"/);
		},
	);
});
