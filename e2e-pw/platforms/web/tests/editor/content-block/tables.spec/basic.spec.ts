import { expect } from "@playwright/test";
import { Dropdown } from "@shared-pom/dropdown";
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

	editorTest(
		"Tab in list inside table cell should indent list item instead of navigating to next cell",
		async ({ editor }) => {
			await editor.setMarkdown(md`
			|(*)|  ||
			|-|-|-|
			||||
			||||
		`);
			await editor.type("- item1");
			await editor.press("Enter");
			await editor.type("item2");
			await editor.press("Tab");
			await editor.assertMarkdownContains("   -  item2");
		},
	);

	editorTest(
		"Shift+Tab in list inside table cell should unindent list item instead of navigating to previous cell",
		async ({ editor }) => {
			await editor.setMarkdown(md`
			|(*)|  ||
			|-|-|-|
			||||
			||||
		`);
			await editor.type("- item1");
			await editor.press("Enter");
			await editor.type("item2");
			await editor.press("Tab");
			await editor.press("Shift+Tab");
			await editor.assertMarkdownContains("-  item1");
			await editor.assertMarkdownContains("-  item2");
			const markdown = await editor.markdown();
			expect(markdown).not.toContain("   -  item2");
		},
	);

	editorTest("cell aggregation shows sum", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(
			'<table header="none">\n<tr>\n<td aggregation="sum">\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n11\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n</table>',
		);
		await expect(sharedPage.getByText("33")).toBeVisible();
	});

	editorTest("table sorting", async ({ editor, sharedPage, catalogPage }) => {
		const tableMd =
			"| aboba1   | aboba2   | aboba3   |\n|----------|----------|----------|\n| abobus1  | abobus24 | abobus3  |\n| abobus12 | abobus22 | abobus23 |\n| abobus13 | abobus23 | abobus23 |";
		await editor.setMarkdown(tableMd);

		const firstSortedCell = sharedPage.locator(`table > tbody > tr:nth-of-type(2) > td:first-of-type`);
		await editorTest.step("sort first col", async () => {
			const firstRow = sharedPage.locator(
				`table > tbody > tr:first-of-type > td:nth-of-type(3) > div > .button-container`,
			);
			await firstRow.hover();
			await firstRow.click();

			const descendingButton = sharedPage.getByText("Descending");
			await descendingButton.click();
			await editor.press("Escape");

			await sharedPage.waitForTimeout(1000);
			const cellContent = await firstSortedCell.textContent();

			expect(cellContent).toEqual("abobus12");
		});

		await editorTest.step("sort second col", async () => {
			const firstRow = sharedPage.locator(
				`table > tbody > tr:first-of-type > td:nth-of-type(2) > div > .button-container`,
			);
			await firstRow.hover();
			await firstRow.click();

			const descendingButton = sharedPage.getByText("Descending");
			await descendingButton.click();
			await editor.press("Escape");

			await sharedPage.waitForTimeout(1000);
			const cellContent = await firstSortedCell.textContent();

			expect(cellContent).toEqual("abobus13");
		});

		await editorTest.step("check table after reload", async () => {
			await sharedPage.reload();
			await catalogPage.waitForLoad();

			const cellContent = await firstSortedCell.textContent();
			expect(cellContent).toEqual("abobus13");
		});

		await editorTest.step("add column", async () => {
			const expectedMdContent = `<table header="row" sortingOrder="3,1">`;
			await sharedPage.getByTestId("table").hover();
			await sharedPage.getByTestId("qa-add-column-1").click();

			await editor.assertMarkdownContains(expectedMdContent);
		});

		await editorTest.step("delete column", async () => {
			const expectedMdContent = `<table header="row" sortingOrder="2,0">`;

			await sharedPage.getByText("aboba1").hover();
			const dropdown = new Dropdown(sharedPage, sharedPage.getByTestId("qa-column-menu-0").nth(0));

			await dropdown.open();
			await dropdown.findItemByTitle("Delete entire column").then((item) => item.click());

			await editor.assertMarkdownContains(expectedMdContent);
		});
	});
});
