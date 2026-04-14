import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { ArticleNotificationSettings } from "@ext/enterprise/notifications/types";
import { Command } from "../../../types/Command";

const update: Command<
	{ catalogName: string; articlePath: Path; notifications: ArticleNotificationSettings; ctx: Context },
	void
> = Command.create({
	path: "enterprise/notifications/update",

	kind: ResponseKind.none,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ catalogName, articlePath, notifications, ctx }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;

		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemRef<Article>(itemRef);
		if (!article) return;

		article.props.notifications = notifications;
		await article.save();
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.path);
		const notifications = body as ArticleNotificationSettings;
		return { ctx, catalogName, articlePath, notifications };
	},
});

export default update;
