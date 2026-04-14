import { apiUtils } from "@core/Api/apiUtils";
import type Context from "@core/Context/Context";
import parseContent from "@core/FileStructue/Article/parseContent";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import { convertContentToUiLanguage } from "@ext/localization/locale/translate";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import type ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import type DocportalApiResponse from "../../logic/DocportalApiResponse";
import { headers } from "./headers";

const articleHtml = async (
	ctx: Context,
	req: DocportalApiRequest,
	res: DocportalApiResponse,
	sitePresenter: SitePresenter,
	exceptionsResponse: ExceptionsResponse,
	parser: MarkdownParser,
	parserContextFactory: ParserContextFactory,
	catalogName: string,
	articleId: string,
) => {
	const { article, catalog } = await sitePresenter.getArticleByPathOfCatalog([catalogName, articleId]);

	if (exceptionsResponse.checkArticleAvailability(catalog, catalogName, article, articleId)) {
		return res.getBunResponse();
	}
	const originDomain = (req.query.originDomain as string) ?? apiUtils.getDomain(req);
	await parseContent(article, catalog, ctx, parser, parserContextFactory, originDomain);
	const parserContext = await parserContextFactory.fromArticle(
		article,
		catalog,
		convertContentToUiLanguage(ctx.contentLanguage || catalog?.props?.language),
	);
	const htmlContent = parser.getHtml((await article.parsedContent.read()).renderTree, parserContext, originDomain);

	if (req.method === "HEAD") {
		return new Response("", {
			status: 200,
			headers: { ...headers.html, ...headers.base, ...headers.length(htmlContent) },
		});
	}
	return new Response(htmlContent, { status: 200, headers: { ...headers.html, ...headers.base } });
};

export default articleHtml;
