import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const startClone: Command<
	{ path: Path; data: StorageData; recursive?: boolean; branch?: string; isBare?: boolean },
	void
> = Command.create({
	path: "storage/startClone",

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ path, data, recursive, branch, isBare }) {
		const workspace = await this._app.wm.currentOrDefault();
		const { rp } = this._app;

		const fs = workspace.getFileStructure();

		const entry = await fs.getCatalogEntryByPath(path, false, { isCloning: true });
		if (await workspace.getBaseCatalog(entry.name)) return;

		workspace.addCatalogEntry(entry);

		void rp.cloneNewRepository(fs, path, data, recursive, isBare, branch, async (_, isCancelled) => {
			if (isCancelled) {
				await workspace.removeCatalog(entry.name, false);
				return;
			}

			await workspace.addCatalog(await fs.getCatalogByPath(path));
		});
	},

	params(_, q, body) {
		return {
			path: new Path(q.path),
			data: body,
			recursive: q.recursive ? q.recursive === "true" : null,
			branch: q.branch ? q.branch : null,
			isBare: q.isBare ? q.isBare === "true" : false,
		};
	},
});

export default startClone;
