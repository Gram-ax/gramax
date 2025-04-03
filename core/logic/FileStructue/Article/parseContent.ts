import { ArticleFilter } from "@core/FileStructue/Catalog/Catalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { Category } from "@core/FileStructue/Category/Category";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import RuleProvider from "@ext/rules/RuleProvider";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { ItemType } from "../Item/ItemType";
import { Article, type Content } from "./Article";

export const getChildLinks = (category: Category, catalog: ReadonlyCatalog, filters: ArticleFilter[]) => {
	const items = category.items.filter((i) => !filters || filters.every((f) => f(i as Article, catalog)));
	if (items.length == 0) return "";
	return "[view:hierarchy=none::::List]";
};

const getExtractHeader = ({ editTree, renderTree }: Content): string => {
	let header: string = null;

	if (editTree) {
		const content = editTree.content;
		if (content && content[0] && content[0].type == "heading" && content[0].attrs.level == 1) {
			header = content[0].text;
			content.splice(0, 1);
		}
	}

	if (renderTree && typeof renderTree == "object") {
		const content = renderTree.children;
		if (
			content?.[0] &&
			typeof content[0] == "object" &&
			content[0].name == "Heading" &&
			content[0].attributes.level == 1
		) {
			header = content[0].attributes.title;
			content.splice(0, 1);
		}
	}

	return header;
};

async function parseContent(
	article: Article,
	catalog: ReadonlyCatalog,
	ctx: Context,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	initChildLinks = true,
	requestUrl?: string,
) {
	const hasContent = !(await article.parsedContent.isNull());

	if (!article) return;
	if (article.type == ItemType.article && !!hasContent && initChildLinks) return;
	if (article.type == ItemType.category && !!hasContent && !!article.content?.trim?.() && initChildLinks) {
		return;
	}

	const context = parserContextFactory.fromArticle(
		article,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
		ctx.user?.isLogged,
	);

	await article.parsedContent.write(async () => {
		const filters = new RuleProvider(ctx).getItemFilters();
		const content =
			article.type == ItemType.category && !article.content?.trim?.()
				? initChildLinks
					? getChildLinks(article as Category, catalog, filters)
					: ""
				: article.content;

		const parsedContent = await parser.parse(content, context, requestUrl);
		const header = getExtractHeader(parsedContent);
		if (header) article.props.title = header;
		return parsedContent;
	});
}

export { getExtractHeader };
export default parseContent;
