import { sleep } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Snippets (serial)", () => {
	editorTest.describe.configure({ mode: "serial" });

	editorTest.beforeEach(async () => {
		await sleep(1000);
	});

	editorTest("create & fill snippet", async ({ sharedPage, editor }) => {
		await editorTest.step("create snippet", async () => {
			await sharedPage.getByTestId("catalog-actions").click();
			await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
			await sharedPage.getByRole("menuitem", { name: "Snippets" }).click();
			await sharedPage.getByRole("button", { name: "New snippet" }).click();
			await sharedPage.getByText("Untitled").first().click();
		});

		await editorTest.step("fill snippet", async () => {
			await editor.type("Test Snippet");
			await editor.press("Enter");
			await editor.type("snippet content");
			await editor.press("Enter");
			await editor.clickToolbar("heading-2");
			await editor.type("Snippet Heading");
		});

		await editor.forceSave();
		await sleep(1000);
	});

	editorTest("insert snippet into article", async ({ editor, sharedPage }) => {
		await editor.hoverToolbar("pencil-ruler");
		await sharedPage.getByRole("menuitem", { name: "Snippets" }).hover();
		await sharedPage.getByRole("option", { name: "Test Snippet" }).click();
		await editor.assertMarkdownContains(/<snippet id=".+"\/>/);
	});

	editorTest("delete snippet", async ({ sharedPage }) => {
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await sharedPage.getByRole("menuitem", { name: "Snippets" }).click();
		await sharedPage.getByText("Test Snippet").hover();
		await sharedPage.getByRole("button", { name: "Test Snippet" }).getByRole("button").click();
		await sharedPage.getByText("Delete").click();
		await sharedPage.getByRole("button", { name: "Continue" }).click();
	});

	editorTest("verify snippet deleted", async ({ sharedPage }) => {
		await sharedPage.reload();
		await sharedPage.getByTestId("catalog-actions").click();
		await sharedPage.getByRole("menuitem", { name: "Tools" }).hover();
		await sharedPage.getByRole("menuitem", { name: "Snippets" }).click();
		await sharedPage.getByText("No snippets in the current catalog").waitFor();
	});
});
