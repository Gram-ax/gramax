import getApplication from "@app/node/app";
import { exportedKeys } from "@ext/wordExport/layouts";
import getItemRef from "@ext/workspace/test/getItemRef";
import { Article } from "@core/FileStructue/Article/Article";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import parseContent from "@core/FileStructue/Article/parseContent";
import ctx from "@ext/wordExport/tests/ContextMock";

const setupTestEnvironment = async () => {
	const app = await getApplication();
	const wm = app.wm;
	const catalog = await wm.current().getCatalog("ExportCatalog");
	const path = "category/_index.md";
	const item = catalog.findItemByItemRef(getItemRef(catalog, path));

	return { app, catalog, item, ctx };
};

describe("Маркдаун фильтер правильно", () => {
	test("находит неподдерживаемые элементы с ключами", async () => {
		const { app, catalog, item, ctx } = await setupTestEnvironment();
		const article = item as Article;

		await parseContent(article, catalog, ctx, app.parser, app.parserContextFactory);

		const markdownElementsFilter = new MarkdownElementsFilter(exportedKeys);
		const unsupportedElements = markdownElementsFilter.getUnsupportedElements(
			article.parsedContent.renderTree as Tag,
		);

		expect(unsupportedElements.get("Html")).toEqual(1);
		expect(unsupportedElements.get("OpenApi")).toEqual(1);
		expect(unsupportedElements.size).toEqual(2);
	});

	test("находит неподдерживаемые элементы без ключей", async () => {
		const { app, catalog, item, ctx } = await setupTestEnvironment();
		const article = item as Article;

		await parseContent(article, catalog, ctx, app.parser, app.parserContextFactory);

		const markdownElementsFilter = new MarkdownElementsFilter(undefined);
		const supportedElements = markdownElementsFilter.getUnsupportedElements(
			article.parsedContent.renderTree as Tag,
		);

		expect(supportedElements.size).toEqual(18);
	});
});
