import { MainMiddleware } from "@core/Api/middleware/MainMiddleware";
import type Query from "@core/Api/Query";
import SEOGenerator from "@core/Sitemap/SEOGenerator";
import { ApplyApiMiddleware } from "apps/next/logic/Api/ApplyMiddleware";
import fs from "fs";
import path from "path";

const Robots = () => {
	return null;
};

export async function getServerSideProps({ req, res }) {
	const filePath = path.join(process.cwd(), "../../public", "robots.txt");
	await ApplyApiMiddleware(
		async function (req, res) {
			const ctx = await this.app.contextFactory.from({ req, res, query: req.query as Query });
			const basePath = this.app.conf.basePath ?? "";
			const workspace = this.app.wm.current();
			const sg = new SEOGenerator(workspace);
			const robots = fs.existsSync(filePath)
				? fs.readFileSync(filePath, "utf8")
				: sg.generateRobots(`${ctx.domain}${basePath}/sitemap.xml`, this.app.conf.disableSeo);
			res.setHeader("Content-Type", "text/plain");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.send(robots);
		},
		[new MainMiddleware()],
	)(req, res);

	return {
		props: {},
	};
}

export default Robots;
