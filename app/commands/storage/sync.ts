import { ResponseKind } from "@app/types/ResponseKind";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import LastVisited from "@core/SitePresenter/LastVisited";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import type ClientSyncResult from "@ext/git/core/model/ClientSyncResult";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";
import { AuthorizeMiddleware } from "../../../core/logic/Api/middleware/AuthorizeMiddleware";
import Context from "../../../core/logic/Context/Context";
import { Command } from "../../types/Command";

const sync: Command<{ ctx: Context; catalogName: string; articlePath: Path }, ClientSyncResult> = Command.create({
	path: "storage/sync",

	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, articlePath }) {
		const { wm, rp, logger, sitePresenterFactory } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;

		const storage = catalog.repo.storage;
		if (!storage) return;

		const currentBranchName = await catalog.repo.gvc.getCurrentBranchName();
		const mrBefore = await catalog.repo.mergeRequests.findBySource(currentBranchName);

		const sourceData = rp.getSourceData<GitSourceData>(ctx, await storage.getSourceName());

		const {
			mergeData: mergeResult,
			isVersionChanged,
			before,
			after,
		} = await catalog.repo.sync({
			recursivePull: this._app.conf.isReadOnly,
			data: sourceData,
			onPull: () => logger.logTrace(`Pulled in catalog "${catalogName}".`),
			onPush: () => logger.logTrace(`Pushed in catalog "${catalogName}".`),
		});

		await catalog.repo.mergeRequests.afterSync(mrBefore, sourceData);

		const isOk = !mergeResult.length;
		const state = await catalog.repo.getState();

		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) {
			const dataProvider = sitePresenterFactory.fromContext(ctx);
			const config = await workspace.config();
			const lastVisited = new LastVisited(ctx, config.name);
			const articleData = await dataProvider.getArticlePageDataByPath([catalogName]);
			lastVisited.setLastVisitedArticle(catalog, articleData.articleProps);
		}

		const mergeData = isOk
			? { ok: true }
			: {
					ok: false,
					mergeFiles: mergeResult,
					reverseMerge: (state.inner as RepositoryMergeConflictState).data.reverseMerge,
					caller: MergeConflictCaller.Sync,
			  };

		return { mergeData, isVersionChanged, before: before.toString(), after: after.toString() };
	},

	params(ctx, q) {
		return {
			ctx,
			catalogName: q.catalogName?.split("/")[0],
			articlePath: new Path(q.articlePath),
		};
	},
});

export default sync;
