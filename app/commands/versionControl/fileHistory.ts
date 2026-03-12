import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import type { ArticleHistoryViewModel, OffsetDataLoader } from "@ext/git/actions/History/model/ArticleHistoryViewModel";
import GitFileHistory from "@ext/git/core/GitFileHistory/GitFileHistory";
import t from "@ext/localization/locale/translate";
import { Command } from "../../types/Command";

const DEFAULT_PAGE_SIZE = 15;
const fileHistory: Command<
	{ catalogName: string; filePath: string; offset: number; limit: number },
	OffsetDataLoader<ArticleHistoryViewModel>
> = Command.create({
	path: "versionControl/fileHistory",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ catalogName, filePath, offset, limit }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(new Path(filePath));
		const gitFileHistory = new GitFileHistory(catalog, fp);

		const loadSize = limit + 1;
		const data = await gitFileHistory.getArticleHistoryInfo(itemRef, offset, loadSize);

		if (!data.length) throw new DefaultError(t("git.history.error.not-found"));

		return {
			items: data.slice(0, limit),
			nextOffset: offset + Math.min(data.length, limit),
			hasMore: data.length > limit,
		};
	},

	params(ctx, q) {
		const limit = +q.limit || DEFAULT_PAGE_SIZE;

		return {
			ctx,
			catalogName: q.catalogName,
			filePath: q.path,
			offset: +q.offset,
			limit,
		};
	},
});

export default fileHistory;
