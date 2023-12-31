import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../../types/Command";

const getReviewLink: Command<
	{ ctx: Context; catalogName: string; userName: string; userEmail: string; filePath: string },
	string
> = Command.create({
	path: "catalog/review/getReviewLink",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, catalogName, userName, userEmail, filePath }) {
		const { lib, sp, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const storage = catalog.getStorage();
		const source = sp.getSourceData(ctx.cookie, await storage.getSourceName());
		const baseStorageData = await storage.getData(source);
		const body: StorageData & { branch: string; filePath: string } = {
			...baseStorageData,
			branch: (await (await catalog.getVersionControl()).getCurrentBranch()).toString(),
			source: { ...baseStorageData.source, userName, userEmail },
			filePath,
		};
		const response = await fetch(`${conf.enterpriseServerUrl}/review/ticket`, {
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
