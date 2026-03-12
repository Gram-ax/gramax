import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("HTML", () => {
	editorTest("create html component", async ({ editor, sharedPage }) => {
		await editor.hoverToolbar("pencil-ruler");
		await sharedPage.getByRole("menuitem", { name: "HTML" }).click();
		await editor.assertMarkdown(md`
			<html>

			<p>HTML</p>

			</html>
		`);
	});

	editorTest("html in list", async ({ editor, sharedPage }) => {
		await editor.press("Tab");
		await editor.hoverToolbar("pencil-ruler");
		await sharedPage.getByRole("menuitem", { name: "HTML" }).click();
		await editor.assertMarkdownContains("<html>");
		await editor.assertMarkdownContains("</html>");
	});

	editorTest("html via setMarkdown", async ({ editor }) => {
		await editor.setMarkdown(md`
			<html>

				<p>HTML 123 123 123</p>

			</html>
		`);
		await editor.bottom().click();
		await editor.type("test");
		await editor.assertMarkdown(
			md`
			<html>

				<p>HTML 123 123 123</p>

			</html>

			test`,
			{ ignoreTabs: true },
		);
	});

	editorTest("delete html block", async ({ editor }) => {
		await editor.setMarkdown(md`
			<html>

			<p>HTML</p>

			</html>
		`);
		await editor.bottom().click();
		await editor.press("Backspace Backspace");
		await editor.type("text");
		await editor.assertMarkdown("text");
	});
});
