import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { ArticleHistoryViewModel } from "@ext/git/actions/History/model/ArticleHistoryViewModel";
import GitFileHistory from "@ext/git/core/GitFileHistory/GitFileHistory";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";

const fileHistory: Command<{ catalogName: string; filePath: string }, ArticleHistoryViewModel[]> = Command.create({
	path: "versionControl/fileHistory",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePath }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(new Path(filePath));
		const gitFileHistory = new GitFileHistory(catalog, fp);

		const data = await gitFileHistory.getArticleHistoryInfo(itemRef);
		if (data.length == 0) throw new DefaultError(t("git.history.error.not-found"));
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
