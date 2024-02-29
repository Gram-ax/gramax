import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { ArticleHistoryViewModel } from "@ext/git/actions/History/model/ArticleHistoryViewModel";
import GitFileHistory from "@ext/git/core/GitFileHistory/GitFileHistory";
import { Command, ResponseKind } from "../../types/Command";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";

const fileHistory: Command<{ catalogName: string; filePath: string }, ArticleHistoryViewModel[]> = Command.create({
	path: "versionControl/fileHistory",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePath }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const fp = lib.getFileProviderByCatalog(catalog);
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
			conf.enterpriseServerUrl,
			{ corsProxy: conf.corsProxy },
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
