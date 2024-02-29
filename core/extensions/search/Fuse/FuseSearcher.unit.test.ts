import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { resolve } from "path";
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
						tags: "Это содержимое документа с специальными символами: ",
					},
					{
						path: "2",
						pathname: "2",
						title: "Пример документа2",
						content: "Это содержимое $$$ @papupe.com документа с $ специальными символами: ",
						tags: "aa",
					},
					{
						path: "3",
						pathname: "3",
						title: "Другой документ1 papupe",
						content: "aaaaaaaaaaaaaaaa",
						tags: "aa",
					},
					{
						path: "4",
						pathname: "4",
						title: "Другой документ2",
						content: "Содержимое другого <документа специальных .;..%alasd;asfi< символов",
						tags: "aa",
					},
					{
						path: "5",
						pathname: "5",
						title: "Другой документ3",
						content: "Содержимое другого документа Без специальных символов asdfasdfasdfasdfasdfasdfasd",
						tags: "aa",
					},
					{
						path: "6",
						pathname: "6",
						title: "Другой документ3.com",
						content: "Содержимое документа, asdfasdfasdfasdfasdfasdfasd выперается",
						tags: "aa",
					},
				];
				return indexData;
			},
			deleteCatalogs: () => {},
			setCatalog: () => {},
		};

		const fuseSearcher = new FuseSearcher(mockIndexDataProvider as any);
		const fileProvider = new DiskFileProvider(resolve(__dirname, "catalogs"));
		const itemRefs = [
			fileProvider.getItemRef(new Path("1")),
			fileProvider.getItemRef(new Path("2")),
			fileProvider.getItemRef(new Path("3")),
			fileProvider.getItemRef(new Path("4")),
			fileProvider.getItemRef(new Path("5")),
			fileProvider.getItemRef(new Path("6")),
		];

		const catalogName = "aaaaaa";

		test("фразу в кавычках", async () => {
			const result = await fuseSearcher.search('"Содержимое документа"', catalogName, itemRefs);
			const resultHighlights = result[0].paragraph;

			expect(resultHighlights[0].target).toEqual("Содержимое документа");
			expect(resultHighlights).toHaveLength(1);
			expect(result).toHaveLength(1);
		});

		test("включая точки", async () => {
			const result1 = await fuseSearcher.search("ент3.com", catalogName, itemRefs);
			const result2 = await fuseSearcher.search(" @example.com", catalogName, itemRefs);

			expect(result1[0]).toMatchObject({ url: "6" });
			expect(result1).toHaveLength(1);

			expect(result2[0]).toMatchObject({ url: "1" });
			expect(result2).toHaveLength(1);
		});

		test("пустой результат, если искать пробелы", async () => {
			const result = await fuseSearcher.search("        ", catalogName, itemRefs);

			expect(result).toHaveLength(0);
		});

		test("с точным совпадением", async () => {
			const result = await fuseSearcher.search('"документа Без"', catalogName, itemRefs);

			expect(result[0]).toMatchObject({ url: "5" });
		});

		test("с обратным точным совпадением", async () => {
			const result = await fuseSearcher.search('"документ1" -символ', catalogName, itemRefs);

			expect(result[0]).toMatchObject({ url: "3" });
			expect(result.length).toEqual(1);
		});

		test("с запросом, в котором есть ошибка", async () => {
			const result = await fuseSearcher.search("ыыпераетса", catalogName, itemRefs);

			expect(result[0]).toMatchObject({ url: "6" });
			expect(result).toHaveLength(1);
		});

		test("с знаками", async () => {
			const result = await fuseSearcher.search(".;..%:", catalogName, itemRefs);

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
						tags: "Тег",
					},
					{
						path: "2",
						pathname: "2",
						title: "Текст",
						content: "Не имеем подходящего слова",
						tags: "Тег",
					},
					{
						path: "3",
						pathname: "3",
						title: "Тексд",
						content: "Не имеем подходящего слова",
						tags: "Тег",
					},
					{
						path: "4",
						pathname: "4",
						title: "Тексд",
						content: 'Имеем подходящее слово "Тексд"',
						tags: "Тег",
					},
				];
				return indexData;
			},
			deleteCatalogs: () => {},
			setCatalog: () => {},
		};

		const fuseSearcher = new FuseSearcher(mockIndexDataProvider as any);
		const fileProvider = new DiskFileProvider(resolve(__dirname, "catalogs"));
		const itemRefs = [
			fileProvider.getItemRef(new Path("1")),
			fileProvider.getItemRef(new Path("2")),
			fileProvider.getItemRef(new Path("3")),
			fileProvider.getItemRef(new Path("4")),
		];

		const catalogName = "aaaaaa";

		test("простой запрос", async () => {
			const result = await fuseSearcher.search("текст", catalogName, itemRefs);

			expect(result[0]).toMatchObject({ url: "1" });
			expect(result[1]).toMatchObject({ url: "4" });
			expect(result[2]).toMatchObject({ url: "2" });
			expect(result[3]).toMatchObject({ url: "3" });
			expect(result).toHaveLength(4);
		});
	});
});
