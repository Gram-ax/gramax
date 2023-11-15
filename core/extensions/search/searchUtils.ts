import { htmlToText } from "html-to-text";
import { Article } from "../../logic/FileStructue/Article/Article";
import { Catalog } from "../../logic/FileStructue/Catalog/Catalog";
import { defaultLanguage } from "../localization/core/model/Language";
import { localizationProps } from "../localization/core/rules/FSLocalizationRules";
import MarkdownParser from "../markdown/core/Parser/Parser";
import ParserContextFactory from "../markdown/core/Parser/ParserContext/ParserContextFactory";

const searchUtils = {
	async getIndexContent(
		catalog: Catalog,
		article: Article,
		parser: MarkdownParser,
		parserContextFactory: ParserContextFactory,
	) {
		try {
			return htmlToText(
				article?.parsedContent?.htmlValue
					? article?.parsedContent?.htmlValue
					: await parser.parseToHtml(
							article.content,
							parserContextFactory.fromArticle(
								article,
								catalog,
								article.getProp(localizationProps.language) ?? defaultLanguage,
								true,
							),
					  ),
				{ tables: ["*"], selectors: [{ selector: "span.vc-comment-vars", format: "skip" }] },
			);
		} catch {
			return null;
		}
	},
};

export default searchUtils;
