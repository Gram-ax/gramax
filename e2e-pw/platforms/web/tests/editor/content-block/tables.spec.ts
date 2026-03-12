import { expect } from "@playwright/test";
import { md } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

editorTest.describe("Table", () => {
	editorTest("fill table with hotkeys", async ({ editor }) => {
		await editor.setMarkdown(md`
			|(*)|  ||
			|-|-|-|
			||||
			||||
		`);
		await editor.press(
			"a ArrowDown b ArrowRight b ArrowDown Shift+Tab c Tab c Tab c ArrowUp b ArrowUp ArrowLeft a Tab a",
		);
		await editor.assertMarkdown(md`
			| a | a | a |
			|---|---|---|
			| b | b | b |
			| c | c | c |
		`);
	});

	editorTest("create bullet list in table", async ({ editor }) => {
		await editor.setMarkdown(md`
			|(*)|  ||
			|-|-|-|
			||||
			||||
		`);
		await editor.type("- text");
		await editor.press("Enter");
		await editor.type("test");
		await editor.assertMarkdownContains("-  text");
		await editor.assertMarkdownContains("-  test");
	});

	editorTest("create code block in table", async ({ editor }) => {
		await editor.setMarkdown(md`
			|(*)|  ||
			|-|-|-|
			||||
			||||
		`);
		await editor.clickToolbar("code");
		await editor.type("text");
		await editor.assertMarkdownContains("```");
		await editor.assertMarkdownContains("text");
	});

	editorTest("exit table with double Enter", async ({ editor }) => {
		await editor.setMarkdown(md`
			||||
			|-|-|-|
			||||
			|||(*)|
		`);
		await editor.press("Enter Enter");
		await editor.type("text after table");
		await editor.assertMarkdownContains("text after table");
	});

	editorTest("exit complex table with rowspan", async ({ editor }) => {
		await editor.setMarkdown(
			'{% table header="row" %}\n\n---\n\n*  \n\n*  \n\n*  \n\n---\n\n*  \n\n*  \n\n*  \n\n---\n\n*  \n\n*  \n\n*  \n\n---\n\n*  \n\n*  \n\n*  {% rowspan=2 %}\n\n   (*)\n\n---\n\n*  \n\n*  \n\n{% /table %}',
		);
		await editor.press("Enter Enter");
		await editor.type("text after table");
		await editor.assertMarkdownContains("text after table");
	});

	editorTest("add rows", async ({ editor, sharedPage }) => {
		await editor.setMarkdown('{% table header="row" %}\n\n---\n\n*  {% align="center" %}\n\n  \n\n{% /table %}');

		await editorTest.step("above table", async () => {
			await sharedPage.getByTestId("table").hover();
			await sharedPage.getByTestId("qa-add-row-0").click();
		});

		await editorTest.step("below table", async () => {
			await sharedPage.getByTestId("table").hover();
			await sharedPage.getByTestId("qa-add-row-down").click();
		});

		await editor.assertMarkdownContains('<table header="row">');
		await editor.assertMarkdownContains("</table>");
	});

	editorTest("cell aggregation shows sum", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(
			'<table header="none">\n<tr>\n<td aggregation="sum">\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n</table>',
		);
		await expect(sharedPage.getByText("33")).toBeVisible();
	});
});
