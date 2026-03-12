import { extractHeader } from "@core/FileStructue/Article/extractHeader";
import type { ArticleFilter } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Category } from "@core/FileStructue/Category/Category";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import RuleProvider from "@ext/rules/RuleProvider";
import type MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import type ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import type Context from "../../Context/Context";
import { ItemType } from "../Item/ItemType";
import type { Article } from "./Article";

export const getChildLinks = (category: Category, catalog: ReadonlyCatalog, filters: ArticleFilter[]) => {
	const items = category.items.filter((i) => !filters || filters.every((f) => f(i as Article, catalog)));
	if (items.length === 0) return "";
	return "[view:hierarchy=none::::List]";
};

async function parseContent(
	article: Article,
	catalog: ReadonlyCatalog,
	ctx: Context,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	requestUrl?: string,
) {
	if (!article) return;
	const hasContent = !(await article.parsedContent.isNull());

	if (article.type === ItemType.article && hasContent) return;
	if (article.type === ItemType.category && hasContent && !!article.content?.trim?.()) {
		return;
	}

	const context = await parserContextFactory.fromArticle(
		article,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
		ctx.user?.isLogged,
	);

	await article.parsedContent.write(async () => {
		const filters = new RuleProvider(ctx).getItemFilters();
		const content =
			article.type === ItemType.category && !article.content?.trim?.() && !article.props.template
				? getChildLinks(article as Category, catalog, filters)
				: article.content;

		const parsedContent = await parser.parse(content, context, requestUrl);
		if (!article.props.title) {
			const header = extractHeader(parsedContent);
			if (header) article.props.title = header;
		}
		return parsedContent;
	});
}

export default parseContent;
