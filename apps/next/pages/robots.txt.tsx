import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";

const Robots = () => {
	return null;
};

export async function getServerSideProps({ req, res }) {
	await ApplyApiMiddleware(
		function (req, res: any) {
			const ctx = this.app.contextFactory.from(req, res, req.query);
			const basePath = this.app.conf.basePath ?? "";
			const workspace = this.app.wm.current();
			const sg = new SEOGenerator(workspace);
			const robots = sg.generateRobots(`${ctx.domain}${basePath}/sitemap.xml`);

			res.setHeader("Content-Type", "text/plain");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.write(robots);
			res.end();
		},
		[new MainMiddleware()],
	)(req, res);

	return {
		props: {},
	};
}

export default Robots;
