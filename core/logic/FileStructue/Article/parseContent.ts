import { Category } from "@core/FileStructue/Category/Category";
import { ItemType } from "@core/FileStructue/Item/Item";
import HiddenRule from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import LocalizationRules from "@ext/localization/core/rules/LocalizationRules";
import SecurityRules from "@ext/security/logic/SecurityRules";
import DefaultError from "../../../extensions/errorHandlers/logic/DefaultError";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { ArticleFilter, Catalog } from "../Catalog/Catalog";
import { Article } from "./Article";

const getChildLinks = (category: Category, catalog: Catalog, filters: ArticleFilter[]) => {
	return category.items
		.filter((i) => !filters || filters.every((f) => f(i as Article, catalog.getName())))
		.map((i) => {
			const link = i.ref.path.value.replace(catalog.getRootCategoryPath().value, "...");
			return `- [${i.getProp("title")}](${link})`;
		})
		.join("\n\n");
};

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

		const hr = new HiddenRule();
		const lr = new LocalizationRules(ctx.lang);
		const sr = new SecurityRules(ctx.user);
		const filters = [lr.getFilterRule(), hr.getFilterRule(), sr.getFilterRule()];
		const content =
			article.type == ItemType.category && !article.content
				? getChildLinks(article as Category, catalog, filters)
				: article.content;
		article.parsedContent = await parser.parse(content, context);
	} catch (e) {
		throw new DefaultError(`Article ${article.ref.path.value} parse error`, e);
	}
}

export default parseContent;
