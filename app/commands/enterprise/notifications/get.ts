import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { ArticleNotificationSettings } from "@ext/enterprise/notifications/types";
import { Command } from "../../../types/Command";

const get: Command<{ catalogName: string; articlePath: Path; ctx: Context }, ArticleNotificationSettings> =
	Command.create({
		path: "enterprise/notifications/get",

		kind: ResponseKind.json,

		async do({ catalogName, articlePath, ctx }) {
			const workspace = this._app.wm.current();
			const catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return null;

			const fp = workspace.getFileProvider();
			const itemRef = fp.getItemRef(articlePath);
			const article = catalog.findItemByItemRef<Article>(itemRef);
			if (!article) return null;

			return article.props.notifications ?? null;
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.path);
			return { ctx, catalogName, articlePath };
		},
	});

export default get;
