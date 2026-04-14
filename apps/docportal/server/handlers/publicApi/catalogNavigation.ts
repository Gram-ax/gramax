import type SitePresenter from "@core/SitePresenter/SitePresenter";
import type ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import TransformData from "@ext/publicApi/TransformData";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import type DocportalApiResponse from "../../logic/DocportalApiResponse";
import { headers } from "./headers";

const catalogNavigation = async (
	req: DocportalApiRequest,
	res: DocportalApiResponse,
	sitePresenter: SitePresenter,
	exceptionsResponse: ExceptionsResponse,
	catalogName: string,
) => {
	const { catalog } = await sitePresenter.getArticleByPathOfCatalog([catalogName]);

	if (exceptionsResponse.checkCatalogAvailability(catalog, catalogName)) {
		return res.getBunResponse();
	}

	const itemLinks = await sitePresenter.getCatalogNav(catalog, "");
	const jsonNavigationTree = TransformData.getNavigation(catalogName, itemLinks);
	const stringifiedNavigationTree = JSON.stringify(jsonNavigationTree);
	if (req.method === "HEAD") {
		return new Response("", {
			status: 200,
			headers: { ...headers.json, ...headers.base, ...headers.length(stringifiedNavigationTree) },
		});
	}
	return new Response(stringifiedNavigationTree, { status: 200, headers: { ...headers.json, ...headers.base } });
};

export default catalogNavigation;
