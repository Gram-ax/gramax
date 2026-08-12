import { expect } from "@playwright/test";
import { resizerTest } from "./resizer.fixture";

resizerTest.describe("Resizer — Mermaid diagram", () => {
	resizerTest("resizer appears when diagram is selected", async ({ sharedPage, editor, resizer }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "Mermaid" }).click();

		const diagram = sharedPage.getByTestId("Mermaid");
		await expect(diagram).toBeVisible();

		await expect(resizer).toHaveAttribute("aria-hidden", "false");
	});

	resizerTest(
		"drag resizer on diagram saves updated scale to markdown",
		async ({ editor, sharedPage, dragResizer, resizer }) => {
			await editor.clickToolbar("semiBlocks");
			await sharedPage.getByRole("menuitem", { name: "Mermaid" }).click();

			const diagram = sharedPage.getByTestId("Mermaid");
			await expect(diagram).toBeVisible();
			await diagram.click();

			await expect(resizer).toHaveAttribute("aria-hidden", "false");

			await dragResizer(60);
			await editor.forceSave();

			await editor.assertMarkdownContains(/scale="\d+px"/);
		},
	);
});
