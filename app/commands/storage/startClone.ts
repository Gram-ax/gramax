import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { NetworkConnectMiddleWare } from "@core/Api/middleware/NetworkConntectMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const startClone: Command<{ path: Path; data: StorageData; recursive?: boolean; branch?: string }, void> =
	Command.create({
		path: "storage/startClone",

		middlewares: [new NetworkConnectMiddleWare(), new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

		async do({ path, data, recursive, branch }) {
			const workspace = await this._app.wm.currentOrDefault();
			const { rp } = this._app;

			const fs = workspace.getFileStructure();
			const fp = workspace.getFileProvider();

			const entry = await fs.getCatalogEntryByPath(path, false, { isCloning: true });
			if (workspace.getCatalogEntry(entry.getName())) return;

			workspace.addCatalogEntry(entry);
			void rp.cloneNewRepository(fp, path, data, recursive, branch, async () => {
				await workspace.refreshCatalog(path.toString());
			});
		},

		params(_, q, body) {
			return {
				path: new Path(q.path),
				data: body,
				recursive: q.recursive ? q.recursive === "true" : null,
				branch: q.branch ? q.branch : null,
			};
		},
	});

export default startClone;
