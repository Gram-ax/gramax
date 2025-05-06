import { IndexData } from "../IndexData";
import FuseSearcher from "./FuseSearcher";

describe("FuseSearcher", () => {
	describe("находит", () => {
		const mockIndexDataProvider = {
			getAndSetIndexData: () => {
				const indexData: IndexData[] = [
					{
						path: "1",
						pathname: "1",
						title: "Пример документа1",
						content: "Это содержимое @example.com документа с специальными символами",
					},
					{
						path: "2",
						pathname: "2",
						title: "Пример документа2",
						content: "Это содержимое $$$ @papupe.com документа с $ специальными символами: ",
					},
					{
						path: "3",
						pathname: "3",
						title: "Другой документ1 papupe",
						content: "aaaaaaaaaaaaaaaa",
					},
					{
						path: "4",
						pathname: "4",
						title: "Другой документ2",
						content: "Содержимое другого <документа специальных .;..%alasd;asfi< символов",
					},
					{
						path: "5",
						pathname: "5",
						title: "Другой документ3",
						content: "Содержимое другого документа Без специальных символов asdfasdfasdfasdfasdfasdfasd",
					},
					{
						path: "6",
						pathname: "6",
						title: "Другой документ3.com",
						content: "Содержимое документа, asdfasdfasdfasdfasdfasdfasd выперается",
					},
				];
				return indexData;
			},
			clear: () => {},
		};

		const fuseSearcher = new FuseSearcher(mockIndexDataProvider as any);
		const articleIds = ["1", "2", "3", "4", "5", "6"];

		const catalogName = "aaaaaa";

		test("фразу в кавычках", async () => {
			const result = await fuseSearcher.search('"Содержимое документа"', catalogName, articleIds);
			const resultHighlights = result[0].paragraph;

			expect(resultHighlights[0].target).toEqual("Содержимое документа");
			expect(resultHighlights).toHaveLength(1);
			expect(result).toHaveLength(1);
		});

		test("включая точки", async () => {
			const result1 = await fuseSearcher.search("ент3.com", catalogName, articleIds);
			const result2 = await fuseSearcher.search(" @example.com", catalogName, articleIds);

			expect(result1[0]).toMatchObject({ url: "6" });
			expect(result1).toHaveLength(1);

			expect(result2[0]).toMatchObject({ url: "1" });
			expect(result2).toHaveLength(1);
		});

		test("пустой результат, если искать пробелы", async () => {
			const result = await fuseSearcher.search("        ", catalogName, articleIds);

			expect(result).toBe(null);
		});

		test("с точным совпадением", async () => {
			const result = await fuseSearcher.search('"документа Без"', catalogName, articleIds);

			expect(result[0]).toMatchObject({ url: "5" });
		});

		test("с обратным точным совпадением", async () => {
			const result = await fuseSearcher.search('"документ1" -символ', catalogName, articleIds);

			expect(result[0]).toMatchObject({ url: "3" });
			expect(result.length).toEqual(1);
		});

		test("с запросом, в котором есть ошибка", async () => {
			const result = await fuseSearcher.search("ыыпераетса", catalogName, articleIds);

			expect(result[0]).toMatchObject({ url: "6" });
			expect(result).toHaveLength(1);
		});

		test("с знаками", async () => {
			const result = await fuseSearcher.search(".;..%:", catalogName, articleIds);

			expect(result[0]).toMatchObject({ url: "4" });
			expect(result).toHaveLength(1);
		});
	});

	describe("сортирует", () => {
		const mockIndexDataProvider = {
			getAndSetIndexData: () => {
				const indexData: IndexData[] = [
					{
						path: "1",
						pathname: "1",
						title: "Текст",
						content: 'Имеем подходящее слово "текст"',
					},
					{
						path: "2",
						pathname: "2",
						title: "Текст",
						content: "Не имеем подходящего слова",
					},
					{
						path: "3",
						pathname: "3",
						title: "Тексд",
						content: "Не имеем подходящего слова",
					},
					{
						path: "4",
						pathname: "4",
						title: "Тексд",
						content: 'Имеем подходящее слово "Тексд"',
					},
				];
				return indexData;
			},
			clear: () => {},
		};

		const fuseSearcher = new FuseSearcher(mockIndexDataProvider as any);
		const articleIds = ["1", "2", "3", "4"];

		const catalogName = "aaaaaa";

		test("простой запрос", async () => {
			const result = await fuseSearcher.search("текст", catalogName, articleIds);

			expect(result[0]).toMatchObject({ url: "1" });
			expect(result[1]).toMatchObject({ url: "4" });
			expect(result[2]).toMatchObject({ url: "2" });
			expect(result[3]).toMatchObject({ url: "3" });
			expect(result).toHaveLength(4);
		});
	});

	describe("соединяет рядом стоящие слова", () => {
		const mockIndexDataProvider = {
			getAndSetIndexData: () => {
				const indexData: IndexData[] = [
					{
						path: "1",
						pathname: "1",
						title: "Тест соединения",
						content: "Это пример текста где слова стоят рядом друг с другом",
					},
					{
						path: "2",
						pathname: "2",
						title: "Тест разрыва",
						content: "Это пример текста где слова разделены другими словами",
					},
					{
						path: "3",
						pathname: "3",
						title: "Тест границ",
						content: "Слова в начале и в конце текста должны соединяться",
					},
					{
						path: "4",
						pathname: "4",
						title: "Тест привет",
						content: "Привет абоба привет абоба",
					},
				];
				return indexData;
			},
			clear: () => {},
		};

		const fuseSearcher = new FuseSearcher(mockIndexDataProvider as any);
		const articleIds = ["1", "2", "3", "4"];
		const catalogName = "test";

		test("соединяет два рядом стоящих слова", async () => {
			const result = await fuseSearcher.search("слова стоят", catalogName, articleIds);
			const paragraph = result[0].paragraph[0];

			expect(paragraph.target).toBe("слова стоят");
			expect(paragraph.prev).toContain("текста где");
			expect(paragraph.next).toContain("рядом");
			expect(result[0].paragraph).toHaveLength(1);
		});

		test("соединяет три рядом стоящих слова", async () => {
			const result = await fuseSearcher.search("друг с другом", catalogName, articleIds);
			const paragraph = result[0].paragraph[0];

			expect(paragraph.target).toBe("друг с другом");
			expect(paragraph.prev).toContain("слова стоят");
			expect(paragraph.next).toBe("");
			expect(result[0].paragraph).toHaveLength(4);
		});

		test("соединяет слова в начале текста", async () => {
			const result = await fuseSearcher.search("Слова в", catalogName, articleIds);
			const paragraph = result[1].paragraph[0];

			expect(paragraph.target).toBe("Слова в");
			expect(paragraph.prev).toBe("");
			expect(paragraph.next).toContain("начале");
			expect(result[1].paragraph).toHaveLength(2);
		});

		test("соединяет слова в конце текста", async () => {
			const result = await fuseSearcher.search("должны соединяться", catalogName, articleIds);
			const paragraph = result[0].paragraph[0];

			expect(paragraph.target).toBe("должны соединяться");
			expect(paragraph.prev).toContain("и в");
			expect(paragraph.next).toBe("");
			expect(result[0].paragraph).toHaveLength(1);
		});

		test("не соединяет одинаковые", async () => {
			const result = await fuseSearcher.search("привет абоба", catalogName, articleIds);

			expect(result[0].paragraph).toHaveLength(2);
			expect(result[0].paragraph[0].target).toBe("Привет абоба");
			expect(result[0].paragraph[1].target).toBe("привет абоба");
		});
	});
});
