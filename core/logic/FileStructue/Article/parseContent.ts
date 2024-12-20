import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import MarkdownParser from "../../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Context from "../../Context/Context";
import { ItemType } from "../Item/ItemType";
import { Article } from "./Article";

export const getChildLinks = () => {
	return "[view:hierarchy=none::::List]";
};

const tryExtractHeader = (article: Article) => {
	let header: string = null;

	if (article.parsedContent.editTree) {
		const content = article.parsedContent.editTree.content;
		if (content && content[0] && content[0].type == "heading" && content[0].attrs.level == 1) {
			header = content[0].text;
			content.splice(0, 1);
		}
	}

	if (article.parsedContent.renderTree && typeof article.parsedContent.renderTree == "object") {
		const content = article.parsedContent.renderTree.children;
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

	if (header) article.props.title = header;
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
	if (!article) return;
	if (article.type == ItemType.article && !!article.parsedContent && initChildLinks) return;
	if (article.type == ItemType.category && !!article.parsedContent && !!article.content?.trim?.() && initChildLinks) {
		return;
	}

	const context = parserContextFactory.fromArticle(
		article,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
		ctx.user?.isLogged,
	);
	const content =
		article.type == ItemType.category && !article.content?.trim?.()
			? initChildLinks
				? getChildLinks()
				: ""
			: article.content;
	article.parsedContent = await parser.parse(content, context, requestUrl);
	tryExtractHeader(article);
}

export default parseContent;
