import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { AllowedOriginsMiddleware } from "@core/Api/middleware/AllowedOriginsMiddleware";
import { HttpMethodsMiddleware } from "@core/Api/middleware/HttpMethodsMiddleware";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import { TokenValidationMiddleware } from "@core/Api/middleware/TokenValidationMiddleware";
import TransformData from "@ext/publicApi/TransformData";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const context = await this.app.contextFactory.from({ req, res });
		const dataProvider = this.app.sitePresenterFactory.fromContext(context);
		const homePageData = await dataProvider.getHomePageData(await this.app.wm.current().config());
		res.setHeader("Content-type", "application/json; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");
		const сatalogList = TransformData.getListOfCatalogs(homePageData);
		if (req.method === "HEAD") {
			res.setHeader("Content-Length", `${Buffer.byteLength(JSON.stringify(сatalogList), "utf8")}`);
			res.end();
			return;
		}
		res.send(сatalogList);
	},
	[
		new MainMiddleware(),
		new AllowedOriginsMiddleware(),
		new HttpMethodsMiddleware(),
		new TokenValidationMiddleware(),
	],
);
