import { editorTest } from "@web/fixtures/editor.fixture";
import { expect } from "playwright/test";

editorTest.describe("OpenApi", () => {
	editorTest("Should show method navigation when OpenAPI inserted", async ({ editor, sharedPage }) => {
		await editor.clickToolbar("semiBlocks");
		await sharedPage.getByRole("menuitem", { name: "OpenAPI" }).click();

		await expect(sharedPage.getByTestId("table-of-contents")).toBeVisible();
		await expect(sharedPage.getByTestId("table-of-contents").getByText("Example")).toBeVisible();
		await expect(sharedPage.getByTestId("table-of-contents").getByText("List API versions")).toBeVisible();
	});
});
