import { md } from "@utils/utils";
import { resizerTest } from "@web/tests/editor/content-block/tables.spec/resizer.fixture";

resizerTest.describe("Table resizing", () => {
	resizerTest("resize simple table", async ({ editor, dragResizer }) => {
		await editor.setMarkdown(md`
			||||
			|-|-|-|
			||||
			||||
		`);

		await dragResizer(100, { cellIndex: 1, rowIndex: 1 });
		await editor.assertMarkdown(
			`<table header="row">\n<colgroup><col width="210"/><col width="310"/><col width="210"/></colgroup>\n<tr>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n<tr>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n<td>\n\n\n\n</td>\n</tr>\n</table>`,
		);
	});

	resizerTest("resize table with empty and filled colWidth", async ({ editor, dragResizer }) => {
		await editor.setMarkdown(
			'<table header="row">\n<colgroup><col width="161"/><col/><col width="223"/><col/></colgroup>\n<tr>\n<td>\n\nНаименование\n\n</td>\n<td>\n\nТип данных\n\n</td>\n<td>\n\nОбязательное поле\n\n</td>\n<td>\n\nКомментарий\n\n</td>\n</tr>\n<tr>\n<td>\n\nid\n\n</td>\n<td>\n\n`integer`\n\n</td>\n<td>\n\nДа\n\n</td>\n<td>\n\nId  отсутствия\n\n</td>\n</tr>\n<tr>\n<td>\n\nabsenceReason\n\n</td>\n<td>\n\n`nvarchar(500)`\n\n</td>\n<td>\n\nДа\n\n</td>\n<td>\n\nПричина отсутствия\n\n</td>\n</tr>\n<tr>\n<td>\n\nstatusId\n\n</td>\n<td>\n\n`nvarchar(50)`\n\n</td>\n<td>\n\nНет\n\n</td>\n<td>\n\nСсылка на статус\n\n</td>\n</tr>\n</table>',
		);

		await dragResizer(100, { cellIndex: 1, rowIndex: 1 });

		await editor.assertMarkdown(
			'<table header="row">\n<colgroup><col width="161"/><col width="242"/><col width="223"/><col width="185"/></colgroup>\n<tr>\n<td>\n\nНаименование\n\n</td>\n<td>\n\nТип данных\n\n</td>\n<td>\n\nОбязательное поле\n\n</td>\n<td>\n\nКомментарий\n\n</td>\n</tr>\n<tr>\n<td>\n\nid\n\n</td>\n<td>\n\n`integer`\n\n</td>\n<td>\n\nДа\n\n</td>\n<td>\n\nId  отсутствия\n\n</td>\n</tr>\n<tr>\n<td>\n\nabsenceReason\n\n</td>\n<td>\n\n`nvarchar(500)`\n\n</td>\n<td>\n\nДа\n\n</td>\n<td>\n\nПричина отсутствия\n\n</td>\n</tr>\n<tr>\n<td>\n\nstatusId\n\n</td>\n<td>\n\n`nvarchar(50)`\n\n</td>\n<td>\n\nНет\n\n</td>\n<td>\n\nСсылка на статус\n\n</td>\n</tr>\n</table>',
		);
	});
});
