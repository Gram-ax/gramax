import { Command } from "../../types/Command";
import { ElasticSearchInteractions } from "@ics/gx-elasticsearch-interactions";
import Context from "@core/Context/Context";
import assert from "assert";

const markAsRead: Command<{ logicPath: string; catalogName: string; ctx: Context }, void> = Command.create({
	path: "article/markAsRead",

	async do({ ctx, logicPath, catalogName }) {
		const { conf, wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const article = catalog.findArticle(logicPath, []);
		if (!article) return;

		assert(conf.search.elastic.enabled, "elastic is not enabled");
		assert(conf.search.elastic.instanceName, "instanceName is not set");
		assert(conf.search.elastic.apiUrl, "apiUrl is not set");
		assert(conf.search.elastic.username, "username is not set");
		assert(conf.search.elastic.password, "password is not set");
		assert(ctx.user.info, "user info is not set");

		const options = {
			instanceName: conf.search.elastic.instanceName,
			apiUrl: conf.search.elastic.apiUrl,
			auth: {
				username: conf.search.elastic.username,
				password: conf.search.elastic.password,
			},
		};

		const es = new ElasticSearchInteractions(options);

		const userData = {
			name: ctx.user.info.name,
			email: ctx.user.info.mail,
		};

		const articleData = {
			title: article.getTitle(),
			logicPath: logicPath,
		};

		const catalogData = {
			name: catalog.name,
			title: catalog.props.title,
		};

		const date = new Date();

		await es.markAsAcknowledged({ user: userData, article: articleData, time: date, catalog: catalogData });
	},

	params(ctx, q) {
		const logicPath = q.logicPath;
		const catalogName = q.catalogName;
		return { ctx, logicPath, catalogName };
	},
});

export default markAsRead;
