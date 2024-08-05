import { Category } from "@core/FileStructue/Category/Category";
import RuleProvider from "@ext/rules/RuleProvider";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { ArticleFilter, Catalog } from "../Catalog/Catalog";
import { ItemType } from "../Item/ItemType";
import { Article } from "./Article";

const getChildLinks = (category: Category, catalog: Catalog, filters: ArticleFilter[]) => {
	return category.items
		.filter((i) => !filters || filters.every((f) => f(i as Article, catalog)))
		.map((i) => {
			const link = `./${category.ref.path.parentDirectoryPath.subDirectory(i.ref.path).value}`;
			return `- [${i.getTitle()}](${link.includes(" ") ? `<${link}>` : link})`;
		})
		.join("\n\n");
};

async function parseContent(
	article: Article,
	catalog: Catalog,
	ctx: Context,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	initChildLinks = true,
	requestUrl?: string,
) {
	if (!article) return;
	if (article.type == ItemType.article && !!article.parsedContent && initChildLinks) return;
	if (article.type == ItemType.category && !!article.parsedContent && !!article.content.trim() && initChildLinks) {
		return;
	}

	const context = parserContextFactory.fromArticle(article, catalog, ctx.lang, ctx.user?.isLogged);
	const filters = new RuleProvider(ctx).getItemFilters();
	const content =
		article.type == ItemType.category && !article.content.trim()
			? initChildLinks
				? getChildLinks(article as Category, catalog, filters)
				: ""
			: article.content;
	article.parsedContent = await parser.parse(content, context, requestUrl);
}

export default parseContent;
