import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ShareLinkHandler from "@ext/catalog/actions/share/logic/ShareLinkHandler";
import { Command } from "../../../types/Command";

const getShareLink: Command<{ ctx: Context; catalogName: string; filePath: string }, string> = Command.create({
	path: "catalog/share/getShareLink",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, filePath }) {
		const { wm, rp } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		const storage = catalog.repo.storage;
		const shareLinkCreator = new ShareLinkHandler();
		const source = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		const branch = (await catalog.repo.gvc.getCurrentBranch()).toString();
		const shareLinkData = await storage.getShareData(source, branch, new Path(filePath));
		const ticket = shareLinkCreator.createShareLinkTicket(shareLinkData);
		return `${ctx.domain}/?share=${ticket}`;
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, filePath: q.filePath };
	},
});

export default getShareLink;
