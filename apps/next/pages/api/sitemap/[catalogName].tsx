import type ApiRequest from "@core/Api/ApiRequest";
import type ApiResponse from "@core/Api/ApiResponse";
import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

export default ApplyApiMiddleware(
	async function (req: ApiRequest, res: ApiResponse) {
		const ctx = await this.app.contextFactory.from({ req, res, query: req.query });
		const filters = [new HiddenRules().getItemFilter(), new SecurityRules(ctx.user).getItemFilter()];
		const basePath = this.app.conf.basePath ?? "";
		const catalogName = req.query.catalogName as string;
		const workspace = this.app.wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog || typeof catalog.getItems !== "function") {
			res.statusCode = 404;
			return res.end();
		}

		const sitemap = await new SEOGenerator(workspace, filters).generateCatalogSitemap(
			`${ctx.domain}${basePath}`,
			catalog,
		);
		res.setHeader("Content-type", "application/xml; charset=utf-8");
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.send(sitemap);
	},
	[new MainMiddleware()],
);
