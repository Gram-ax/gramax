import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../../types/Command";

const getReviewLink: Command<
	{ ctx: Context; catalogName: string; userName: string; userEmail: string; filePath: string },
	string
> = Command.create({
	path: "catalog/review/getReviewLink",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, userName, userEmail, filePath }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		const storage = catalog.repo.storage;
		const source = rp.getSourceData(ctx.cookie, await storage.getSourceName());
		const baseStorageData = await storage.getStorageData(source);
		const body: StorageData & { branch: string; filePath: string } = {
			...baseStorageData,
			branch: (await catalog.repo.gvc.getCurrentBranch()).toString(),
			source: { ...baseStorageData.source, userName, userEmail },
			filePath,
		};
		const response = await fetch(`${workspace.config().services?.review?.url}/ticket`, {
			body: JSON.stringify(body),
			method: "POST",
			headers: { "Content-Type": MimeTypes.json },
		});
		if (!response.ok) throw new DefaultError((await response.json()).message);
		const ticket = await response.text();
		return `${ctx.domain}/?review=${ticket}`;
	},

	params(ctx, q, body) {
		const { userName, userEmail } = body;
		return { ctx, catalogName: q.catalogName, userName, userEmail, filePath: q.filePath };
	},
});

export default getReviewLink;
