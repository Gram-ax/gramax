import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { ArticleHistoryViewModel } from "@ext/git/actions/History/model/ArticleHistoryViewModel";
import GitFileHistory from "@ext/git/core/GitFileHistory/GitFileHistory";
import { Command } from "../../types/Command";

const fileHistory: Command<{ catalogName: string; filePath: string }, ArticleHistoryViewModel[]> = Command.create({
	path: "versionControl/fileHistory",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePath }) {
		const { conf, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(new Path(filePath));
		const storage = catalog.repo.storage;
		const storageData = {
			name: await storage.getName(),
			sourceType: await storage.getType(),
			branch: (await catalog.repo.gvc.getCurrentBranch()).toString(),
		};
		const gitFileHistory = new GitFileHistory(
			catalog,
			fp,
			conf.services.review.url,
			{ corsProxy: conf.services.cors.url },
			storageData,
		);

		const data = await gitFileHistory.getArticleHistoryInfo(itemRef);
		if (data.length == 0) throw new Error("Не удалось найти историю файла");
		return data;
	},

	params(ctx, q) {
		return {
			ctx,
			catalogName: q.catalogName,
			filePath: q.path,
		};
	},
});

export default fileHistory;
