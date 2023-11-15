import Library from "../../../logic/Library/Library";
import MarkdownParser from "../../markdown/core/Parser/Parser";
import ParserContextFactory from "../../markdown/core/Parser/ParserContext/ParserContextFactory";
import Connection, { ResponseData } from "./Connection/Connection";
import ServicesSearcher from "./Searcher";
import SaveServiseData from "./models/Data";

const servicesSearcher: ServicesSearcher = new ServicesSearcher(
	{
		addOnChangeRule: (_) => {
			_;
		},
	} as Library,
	{} as Connection,
	{} as MarkdownParser,
	{} as ParserContextFactory
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
		} as ResponseData<SaveServiseData>;

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
