import type { CommandTree } from "@app/commands";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type SitePresenter from "@core/SitePresenter/SitePresenter";
import type ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import type DocportalApiResponse from "../../logic/DocportalApiResponse";
import { headers } from "./headers";

const articleResource = async (
	ctx: Context,
	req: DocportalApiRequest,
	res: DocportalApiResponse,
	sitePresenter: SitePresenter,
	exceptionsResponse: ExceptionsResponse,
	commands: CommandTree,
	catalogName: string,
	articleId: string,
	resourcePath: string,
) => {
	const { article, catalog } = await sitePresenter.getArticleByPathOfCatalog([catalogName, articleId]);

	if (exceptionsResponse.checkArticleAvailability(catalog, catalogName, article, articleId)) {
		return res.getBunResponse();
	}
	const { mime, hashItem } = await commands.article.resource.get.do({
		ctx,
		src: new Path(resourcePath),
		articlePath: article.ref.path,
		catalogName: catalogName,
		mimeType: null,
		providerType: null,
		ifNotExistsErrorText: null,
	});

	const content = await hashItem.getContentAsBinary();

	if (!content) {
		exceptionsResponse.getResourceException(catalogName, articleId, resourcePath);
		return res.getBunResponse();
	}

	if (req.method === "HEAD") {
		if (content) {
			return new Response("", {
				status: 200,
				headers: {
					...headers.base,
					...headers.contentType(mime),
					...headers.contentDisposition(resourcePath, mime),
					...headers.length(content),
				},
			});
		}
	}
	return new Response(Buffer.from(content), {
		status: 200,
		headers: { ...headers.base, ...headers.contentType(mime), ...headers.contentDisposition(resourcePath, mime) },
	});
};

export default articleResource;
