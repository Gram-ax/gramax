import MarkdownFormatter from "@ext/markdown/core/edit/logic/Formatter/Formatter";
import { formatTable } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { JSONContent } from "@tiptap/core";

describe("Преобразоывние простых таблиц", () => {
	test("Пустая таблица", () => {
		const str = `||||
|-|-|-|
||||
||||`;

		const parsedStr = `|   |   |   |
|---|---|---|
|   |   |   |
|   |   |   |`;

		const testParseStr = formatTable(str);
		expect(testParseStr).toEqual(parsedStr);
	});

	test("Простая таблица", () => {
		const str = `|Заголовок 1||Заголовок 3|
|-|-|-|
|ячейка 1|ячейка 2|ячейка 3|
|ячейка 4|ячейка 5|ячейка 6|`;

		const parsedStr = `| Заголовок 1 |          | Заголовок 3 |
|-------------|----------|-------------|
| ячейка 1    | ячейка 2 | ячейка 3    |
| ячейка 4    | ячейка 5 | ячейка 6    |`;

		const testParseStr = formatTable(str);
		expect(testParseStr).toEqual(parsedStr);
	});
});

describe("Экранирование символа `$`", () => {
	test("Парсинг формулы", async () => {
		const editTree: JSONContent = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "inlineMd_component",
							attrs: {
								text: "$a$",
								tag: [
									{
										$$mdtype: "Tag",
										name: "Formula",
									},
								],
							},
						},
					],
				},
			],
		};

		const testParseMarkdown = await new MarkdownFormatter().render(editTree);
		const parsedMarkdown = "$a$";
		expect(testParseMarkdown).toEqual(parsedMarkdown);
	});

	test("Парсинг текста с символом `$`", async () => {
		const editTree: JSONContent = {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [
						{
							type: "text",
							text: "$a$",
						},
					],
				},
			],
		};

		const testParseMarkdown = await new MarkdownFormatter().render(editTree);
		const parsedMarkdown = "\\$a\\$";
		expect(testParseMarkdown).toEqual(parsedMarkdown);
	});
});
