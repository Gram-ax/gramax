import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const startClone: Command<
	{
		path: Path;
		data: StorageData;
		recursive?: boolean;
		branch?: string;
		isBare?: boolean;
		redirectOnClone?: string;
	},
	{ alreadyExist: boolean }
> = Command.create({
	path: "storage/startClone",

	kind: ResponseKind.json,

	middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ path, data, recursive, branch, isBare, redirectOnClone }) {
		const workspace = await this._app.wm.currentOrDefault();
		const { rp } = this._app;

		const fs = workspace.getFileStructure();

		workspace.getAllCatalogs().forEach((c) => delete c.props.redirectOnClone);

		const entry = await fs.getCatalogEntryByPath(path, false, { isCloning: true, redirectOnClone });
		if (await workspace.getBaseCatalog(entry.name)) return { alreadyExist: true };

		workspace.addCatalogEntry(entry);

		void rp.cloneNewRepository(fs, path, data, recursive, isBare, branch, async (_, isCancelled) => {
			const workspace = this._app.wm.current(); // at this point workspace can be changed

			if (isCancelled) {
				await workspace.removeCatalog(entry.name, false);
				return;
			}

			if (await fs.fp.exists(path)) await workspace.addCatalog(await fs.getCatalogByPath(path));
		});

		return { alreadyExist: false };
	},

	params(_, q, body) {
		return {
			path: new Path(q.path),
			data: body,
			recursive: q.recursive ? q.recursive === "true" : null,
			branch: q.branch ? q.branch : null,
			isBare: q.isBare ? q.isBare === "true" : false,
			redirectOnClone: q.redirectOnClone,
		};
	},
});

export default startClone;
