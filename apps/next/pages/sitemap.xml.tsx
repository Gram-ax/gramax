import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import SecurityRules from "@ext/security/logic/SecurityRules";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

const Sitemap = () => {
	return null;
};

export async function getServerSideProps({ req, res }) {
	await ApplyApiMiddleware(
		async function (req, res: any) {
			const ctx = this.app.contextFactory.from(req, res, req.query);
			const filters = [new HiddenRules().getItemFilter(), new SecurityRules(ctx.user).getItemFilter()];
			const basePath = this.app.conf.basePath ?? "";
			const workspace = this.app.wm.current();
			const sitemapIndex = await new SEOGenerator(workspace, filters).generateSitemapIndex(
				`${ctx.domain}${basePath}/api/sitemap`,
			);
			res.setHeader("Content-Type", "application/xml; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.write(sitemapIndex);
			res.end();
		},
		[new MainMiddleware()],
	)(req, res);

	return {
		props: {},
	};
}

export default Sitemap;
