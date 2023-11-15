import getApp from "@app/node/app";
import getItemRef from "../../../../../logic/Library/test/getItemRef";
import ParserContext from "../ParserContext/ParserContext";
import TestContext from "../ParserContext/TestContext";

export const getParserTestData = async (fileName = "emptyArticle") => {
	const app = await getApp();
	const parser = app.parser;
	const formatter = app.formatter;
	const catalog = await app.lib.getCatalog("MarkdownCatalog");
	const fp = app.lib.getFileProviderByCatalog(catalog);
	const testArticleItemRef = getItemRef(catalog, `category/${fileName}.md`);
	const parseContext: ParserContext = new TestContext(testArticleItemRef, catalog, fp, parser, formatter);
	return { parseContext, parser };
};
