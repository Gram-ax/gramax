import type SitePresenter from "@core/SitePresenter/SitePresenter";
import TransformData from "@ext/publicApi/TransformData";
import type { Workspace } from "@ext/workspace/Workspace";
import type DocportalApiRequest from "../../logic/DocportalApiRequest";
import { headers } from "./headers";

const catalogs = async (req: DocportalApiRequest, sitePresenter: SitePresenter, workspace: Workspace) => {
	const homePageData = await sitePresenter.getHomePageData(await workspace.config());
	const catalogs = TransformData.getListOfCatalogs(homePageData);
	const stringifiedCatalogs = JSON.stringify(catalogs);
	if (req.method === "HEAD") {
		return new Response("", {
			status: 200,
			headers: { ...headers.json, ...headers.base, ...headers.length(stringifiedCatalogs) },
		});
	}
	return new Response(stringifiedCatalogs, { headers: { ...headers.json, ...headers.base } });
};

export default catalogs;
