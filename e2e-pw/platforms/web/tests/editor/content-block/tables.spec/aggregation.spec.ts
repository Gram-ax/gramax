import { expect } from "@playwright/test";
import { sleep } from "@utils/utils";
import { editorTest } from "@web/fixtures/editor.fixture";

const tableWithHeader = (method: string, values: number[]) =>
	[
		`<table header="row">`,
		`<tr>`,
		`<td aggregation="${method}">`,
		``,
		`Col`,
		``,
		`</td>`,
		`</tr>`,
		...values.map((v) => `<tr>\n<td>\n\n${v}\n\n</td>\n</tr>`),
		`</table>`,
	].join("\n");

const tableNoHeader = (method: string, values: number[]) =>
	[
		`<table header="none">`,
		`<tr>`,
		`<td aggregation="${method}">`,
		``,
		`${values[0]}`,
		``,
		`</td>`,
		`</tr>`,
		...values.slice(1).map((v) => `<tr>\n<td>\n\n${v}\n\n</td>\n</tr>`),
		`</table>`,
	].join("\n");

editorTest.describe("Table aggregation", () => {
	editorTest("sum", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("sum", [10, 20, 30]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("60");
	});

	editorTest("avg", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("avg", [2, 5, 8]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("5");
	});

	editorTest("min", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("min", [3, 1, 4]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("1");
	});

	editorTest("max", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("max", [3, 1, 4]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("4");
	});

	editorTest("count", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("count", [1, 2, 3]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("3");
	});

	editorTest("countDistinct", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("countDistinct", [1, 2, 2]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("2");
	});

	editorTest("no header — first row is data", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableNoHeader("sum", [10, 20, 30]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("60");
	});

	editorTest("shows dash when no numeric data", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("sum", []));
		await sleep(1000);
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("-");
	});

	editorTest("recalculates after editing a cell", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("sum", [10, 20]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("30");

		await sharedPage.locator("table > tbody > tr:nth-of-type(2) > td").first().click();
		await sharedPage.keyboard.type("40");

		await sleep(1000);
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("1,060");
	});

	editorTest("single footer after adding a row", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("sum", [10, 20]));

		await sharedPage.getByTestId("table").hover();
		await sharedPage.getByTestId("qa-add-row-down").click();

		await expect(sharedPage.locator("tfoot")).toHaveCount(1);
	});

	editorTest("recalculates after adding a row", async ({ editor, sharedPage }) => {
		await editor.setMarkdown(tableWithHeader("sum", [10, 20]));
		await expect(sharedPage.locator("tfoot td").first()).toHaveText("30");

		await sharedPage.getByTestId("table").hover();
		await sharedPage.getByTestId("qa-add-row-down").click();

		await expect(sharedPage.locator("tfoot td").first()).toHaveText("30");
	});
});
