import { ResponseKind } from "@app/types/ResponseKind";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import LastVisited from "@core/SitePresenter/LastVisited";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import { RepStashConflictState } from "@ext/git/core/Repository/model/RepostoryState";
import { AuthorizeMiddleware } from "../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../core/logic/Context/Context";
import { Command } from "../../types/Command";

const sync: Command<{ ctx: Context; catalogName: string; articlePath: Path; recursive?: boolean }, MergeData> =
	Command.create({
		path: "storage/sync",

		kind: ResponseKind.json,

		middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ ctx, catalogName, articlePath, recursive }) {
			const { wm, rp, logger, sitePresenterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName);
			if (!catalog) return;
			const storage = catalog.repo.storage;
			if (!storage) return;
			const sourceData = rp.getSourceData(ctx.cookie, await storage.getSourceName());
			const mergeResult = await catalog.repo.sync({
				recursive,
				data: sourceData,
				onPull: () => logger.logTrace(`Pulled in catalog "${catalogName}".`),
				onPush: () => logger.logTrace(`Pushed in catalog "${catalogName}".`),
			});

			const article = catalog.findItemByItemPath<Article>(articlePath);
			if (!article) {
				const dataProvider = sitePresenterFactory.fromContext(ctx);
				const lastVisited = new LastVisited(ctx);
				const articleData = await dataProvider.getArticlePageDataByPath([catalogName]);
				lastVisited.setLastVisitedArticle(catalog, articleData.articleProps);
			}

			const isOk = !mergeResult.length;
			return isOk
				? { ok: true }
				: {
						ok: false,
						mergeFiles: mergeResult,
						reverseMerge: (catalog.repo.state as RepStashConflictState).data.reverseMerge,
						caller: MergeConflictCaller.Sync,
				  };
		},

		params(ctx, q) {
			return {
				ctx,
				catalogName: q.catalogName,
				articlePath: new Path(q.articlePath),
				recursive: q.recursive === "true",
			};
		},
	});

export default sync;
