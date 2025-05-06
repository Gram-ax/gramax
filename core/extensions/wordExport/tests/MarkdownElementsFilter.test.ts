import getApplication from "@app/node/app";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import t from "@ext/localization/locale/translate";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { getExportedKeys } from "@ext/wordExport/layouts";
import MarkdownElementsFilter from "@ext/wordExport/MarkdownElementsFilter";
import ctx from "@ext/wordExport/tests/ContextMock";
import getItemRef from "@ext/workspace/test/getItemRef";

const setupTestEnvironment = async () => {
	const app = await getApplication();
	const wm = app.wm;
	const catalog = await wm.current().getContextlessCatalog("ExportCatalog");
	const path = "category/_index.md";
	const item = catalog.findItemByItemRef(getItemRef(catalog, path));

	return { app, catalog, item, ctx };
};

describe("Маркдаун фильтер правильно", () => {
	test("находит неподдерживаемые элементы с ключами", async () => {
		const { app, catalog, item, ctx } = await setupTestEnvironment();
		const article = item as Article;

		await parseContent(article, catalog, ctx, app.parser, app.parserContextFactory);

		const markdownElementsFilter = new MarkdownElementsFilter(getExportedKeys());

		const unsupportedElements = await article.parsedContent.read((p) =>
			markdownElementsFilter.getUnsupportedElements(p.renderTree as Tag),
		);

		expect(unsupportedElements.get("Html")).toEqual(1);
		expect(unsupportedElements.get("OpenApi")).toEqual(1);
		expect(unsupportedElements.get(t("diagram.error.mermaid-export-next-error"))).toEqual(1);
		expect(unsupportedElements.size).toEqual(3);
	});

	test("находит неподдерживаемые элементы без ключей", async () => {
		const { app, catalog, item, ctx } = await setupTestEnvironment();
		const article = item as Article;

		await parseContent(article, catalog, ctx, app.parser, app.parserContextFactory);

		const markdownElementsFilter = new MarkdownElementsFilter(undefined);
		const supportedElements = await article.parsedContent.read((p) =>
			markdownElementsFilter.getUnsupportedElements(p.renderTree as Tag),
		);

		expect(supportedElements.size).toEqual(19);
	});
});
