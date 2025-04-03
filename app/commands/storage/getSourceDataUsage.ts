import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Context from "@core/Context/Context";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import { Command } from "../../types/Command";

const getSourceDataUsage: Command<{ ctx: Context; sourceName: string }, string[]> = Command.create({
	path: "storage/getSourceDataUsage",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ ctx, sourceName }) {
		const { wm, rp } = this._app;
		const workspace = wm.current();

		const res = [];

		for (const catalog of workspace.getAllCatalogs().values()) {
			const storage = catalog.repo.storage;
			if (!storage) continue;
			const data = rp.getSourceData(ctx, await storage.getSourceName());
			if (!data) continue;
			if (getStorageNameByData(data) === sourceName) res.push(catalog.name);
		}

		return res;
	},

	params(ctx, query) {
		return { ctx, sourceName: query.sourceName };
	},
});

export default getSourceDataUsage;
