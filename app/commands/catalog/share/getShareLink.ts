import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import ShareLinkHandler from "@ext/catalog/actions/share/logic/ShareLinkHandler";
import { Command, ResponseKind } from "../../../types/Command";

const getShareLink: Command<{ ctx: Context; catalogName: string; filePath: string }, string> = Command.create({
	path: "catalog/share/getShareLink",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, filePath }) {
		const { lib, sp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const storage = catalog.getStorage();
		const shareLinkCreator = new ShareLinkHandler();
		const source = sp.getSourceData(ctx.cookie, await storage.getSourceName());
		const branch = (await (await catalog.getVersionControl()).getCurrentBranch()).toString();
		const shareLinkData = await storage.getReviewData(source, branch, new Path(filePath));
		const ticket = shareLinkCreator.createShareLinkTicket(shareLinkData);
		return `${ctx.domain}/?share=${ticket}`;
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, filePath: q.filePath };
	},
});

export default getShareLink;
