import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import TransformData from "@ext/publicApi/TransformData";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = await this.app.contextFactory.from(req, res);
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const catalogs = await dataProvider.getHomePageData(this.app.wm.current().config());
		res.setHeader("Content-type", "application/json; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");
		const сatalogList = TransformData.getListOfCatalogs(catalogs);
		res.send(сatalogList);
	},
	[new MainMiddleware()],
);
