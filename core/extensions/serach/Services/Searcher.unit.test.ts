import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import Connection, { ResponseData } from "./Connection/Connection";
import ServicesSearcher from "./Searcher";
import SaveServiceData from "./models/Data";

const servicesSearcher: ServicesSearcher = new ServicesSearcher(
	{
		get: () => {},
		getAll: () => {},
		onUpdate: () => {},
	} as any as WorkspaceManager,
	{} as Connection,
);

describe("ServicesSearcher", () => {
	test("парсинт данные возвращаемые с сервера Algolia", () => {
		const tag = "em";
		const searchResponse = {
			hits: [
				{
					_snippetResult: {
						title: { value: `start <${tag}> query </${tag}> text` },
						body: { value: `start <${tag}> query </${tag}> text <${tag}> query2 </${tag}> end` },
					},
					logicPath: "url",
				},
				{
					_snippetResult: {
						title: { value: "Работа с репозиторием" },
						body: { value: `start <${tag}>query</${tag}> end` },
					},
					logicPath: "url2",
				},
			],
		} as ResponseData<SaveServiceData>;

		const searchItems = servicesSearcher._getSearchItems(searchResponse, tag);

		expect(searchItems).toEqual([
			{
				count: 2,
				name: { targets: [{ start: "start ", target: " query " }], end: " text" },
				paragraph: [
					{ prev: "start ", target: " query ", next: "" },
					{ prev: " text ", target: " query2 ", next: " end" },
				],
				score: 1,
				url: "url",
			},
			{
				count: 1,
				name: { targets: [], end: "Работа с репозиторием" },
				paragraph: [{ prev: "start ", target: "query", next: " end" }],
				score: 1,
				url: "url2",
			},
		]);
	});
});
