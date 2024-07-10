import { formatTable } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

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
