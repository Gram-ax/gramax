import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import SecurityRules from "@ext/security/logic/SecurityRules";
import type ServerContext from "../types/ServerContext";

const seo = async (serverContext: ServerContext) => {
	const { req, res, path, app } = serverContext;

	const ctx = await app.contextFactory.fromNode({ req, res });
	const workspace = app.wm.current();
	const filters = [new HiddenRules().getItemFilter(), new SecurityRules(ctx.user).getItemFilter()];
	const sg = new SEOGenerator(workspace, filters);
	const basePath = app.conf.basePath ?? "";

	if (path.pathname === "/sitemap.xml") {
		const sitemapIndex = await sg.generateSitemapIndex(`${ctx.domain}${basePath}/sitemap`);
		return new Response(sitemapIndex, { headers: { "Content-Type": "application/xml" } });
	}

	if (path.pathname === "/robots.txt") {
		const robots = sg.generateRobots(`${ctx.domain}${basePath}/sitemap.xml`, app.conf.disableSeo);
		return new Response(robots, { headers: { "Content-Type": "text/plain" } });
	}

	if (path.pathname.startsWith("/sitemap/")) {
		const catalogName = path.pathname.split("/")[2];
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog || typeof catalog.getItems !== "function") {
			return new Response("Not Found", { status: 404 });
		}
		const sitemap = await sg.generateCatalogSitemap(`${ctx.domain}${basePath}`, catalog);
		return new Response(sitemap, { headers: { "Content-Type": "application/xml" } });
	}
};

export default seo;
