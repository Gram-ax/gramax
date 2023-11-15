import DefaultError from "../../../extensions/errorHandlers/logic/DefaultError";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { Catalog } from "../Catalog/Catalog";
import { Article } from "./Article";

async function parseContent(
	article: Article,
	catalog: Catalog,
	ctx: Context,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
) {
	if (!article || article.parsedContent) return;
	try {
		const context = parserContextFactory.fromArticle(article, catalog, ctx.lang, ctx.user?.isLogged);
		article.parsedContent = await parser.parse(article.content, context);
	} catch (e) {
		throw new DefaultError(`Article ${article.ref.path.value} parse error`, e);
	}
}

export default parseContent;
