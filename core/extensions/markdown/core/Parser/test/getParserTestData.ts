import getApp from "@app/node/app";
import Context from "@app/test/TestContext";
import getItemRef from "../../../../workspace/test/getItemRef";
import ParserContext from "../ParserContext/ParserContext";
import TestContext from "../ParserContext/TestContext";

export const getParserTestData = async (fileName = "emptyArticle") => {
	const app = await getApp();
	const parser = app.parser;
	const formatter = app.formatter;
	const catalog = await app.wm.current().getCatalog("MarkdownCatalog", new Context());
	const fp = app.wm.current().getFileProvider();
	const testArticleItemRef = getItemRef(catalog, `category/${fileName}.md`);
	const parseContext: ParserContext = new TestContext(testArticleItemRef, catalog, fp, parser, formatter);
	return { parseContext, parser };
};
