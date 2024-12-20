import parseContent from "@core/FileStructue/Article/parseContent";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { type ReadonlyCatalog } from "../Catalog/ReadonlyCatalog";
import { Article } from "./Article";

class ArticleParser {
	constructor(
		private _ctx: Context,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
	) {}

	async parse(article: Article, catalog: ReadonlyCatalog) {
		return parseContent(article, catalog, this._ctx, this._parser, this._parserContextFactory);
	}
}

export default ArticleParser;
