import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import TransformData from "@ext/publicApi/TransformData";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = this.app.contextFactory.from(req, res);
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const catalogName = req.query.catalogId as string
		const { catalog } = await dataProvider.getArticleByPathOfCatalog([catalogName]);

		const itemLinks = await dataProvider.getCatalogNav(catalog, "");
		const jsonNavigationTree = TransformData.getNavigation(catalogName, itemLinks);

		res.setHeader("Content-type", "application/json; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");

		res.send(jsonNavigationTree);
	},
	[new MainMiddleware()],
);
