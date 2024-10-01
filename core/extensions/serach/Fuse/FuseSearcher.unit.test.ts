import { IndexData } from "../IndexData";
import FuseSearcher from "./FuseSearcher";

describe("FuseSearcher", () => {
	describe("находит", () => {
		const mockIndexDataProvider = {
			getCatalogValue: () => {
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
			deleteCatalogs: () => {},
			setCatalog: () => {},
			onDataChange: () => {},
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

			expect(result).toHaveLength(0);
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
			getCatalogValue: () => {
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
			deleteCatalogs: () => {},
			setCatalog: () => {},
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
});
