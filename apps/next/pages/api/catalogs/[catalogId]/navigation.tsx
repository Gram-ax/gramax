import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { AllowedOriginsMiddleware } from "@core/Api/middleware/AllowedOriginsMiddleware";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { TokenValidationMiddleware } from "@core/Api/middleware/TokenValidationMiddleware";
import ExceptionsResponse from "@ext/publicApi/ExceptionsResponse";
import TransformData from "@ext/publicApi/TransformData";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = await this.app.contextFactory.from(req, res);
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const catalogName = req.query.catalogId as string;
		const { catalog } = await dataProvider.getArticleByPathOfCatalog([catalogName]);

		if (new ExceptionsResponse(res, context).checkCatalogAvailability(catalog, catalogName)) return;

		const itemLinks = await dataProvider.getCatalogNav(catalog, "");
		const jsonNavigationTree = TransformData.getNavigation(catalogName, itemLinks);

		res.setHeader("Content-type", "application/json; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");

		res.send(jsonNavigationTree);
	},
	[new MainMiddleware(), new AllowedOriginsMiddleware(), new TokenValidationMiddleware()],
);
