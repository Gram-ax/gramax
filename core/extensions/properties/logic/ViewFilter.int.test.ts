import getApplication from "@app/node/app";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ViewFilter from "@ext/properties/logic/ViewFilter";
import { PropertyValue } from "@ext/properties/models";

const getCatalogData = async () => {
	const app = await getApplication();

	const workspace = app.wm.current();
	const propertiesTestCatalog = await workspace.getCatalog("PropertyCatalog");
	const allArticles = propertiesTestCatalog.getItems() as Article[];
	const curArticle = allArticles[0];
	return {
		propertiesTestCatalog,
		allArticles,
		curArticle,
	};
};

const getResult = async (
	defs: PropertyValue[],
	sortBy: string[],
	groupBy: string[],
	select: string[],
	allArticles: Article[],
	propertiesTestCatalog: Catalog,
	curArticle: Article,
) =>
	new ViewFilter(defs, sortBy, groupBy, select, allArticles, curArticle, propertiesTestCatalog).getFilteredArticles();

describe("ViewFilter фильтрует по свойствам", () => {
	test("article", async () => {
		const { propertiesTestCatalog, allArticles, curArticle } = await getCatalogData();

		const defs = [{ name: "Assignee", value: ["EZ", "SF"] }];
		const sortBy = ["Important"];
		const groupBy = ["PO"];
		const select = ["Assignee", "PO", "Important"];

		const result = await getResult(defs, sortBy, groupBy, select, allArticles, propertiesTestCatalog, curArticle);
		expect(result).toStrictEqual([
			{
				articles: [],
				group: ["AM"],
				subgroups: [
					{
						articles: [
							{
								itemPath: "PropertyCatalog/aaa.md",
								linkPath: "PropertyCatalog/aaa",
								otherProps: [
									{
										name: "Important",
										style: "green",
										type: "Flag",
										values: null,
									},
									{
										name: "Assignee",
										style: "purple",
										type: "Enum",
										value: "NV",
										values: ["EZ", "NV", "SF", "SY"],
									},
									{
										name: "PO",
										style: "blue",
										type: "Enum",
										value: "AM",
										values: ["AL", "AM", "EP"],
									},
								],
								resourcePath: "./aaa.md",
								title: "aaaa",
							},
						],
						group: null,
						subgroups: undefined,
					},
				],
			},
		]);
	});
});
