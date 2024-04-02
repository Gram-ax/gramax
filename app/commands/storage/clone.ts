import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const clone: Command<{ path: Path; data: StorageData; recursive?: boolean; branch?: string }, string> = Command.create({
	path: "storage/clone",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ path, data, recursive, branch }) {
		const { lib, rp } = this._app;

		const fs = lib.getFileStructure();
		const fp = lib.getFileProvider();
		await rp.cloneNewRepository(fp, path, data, recursive, branch);
		const entry = await fs.getCatalogEntryByPath(path);
		const catalog = await entry.load();
		await lib.addCatalog(catalog);
		return await catalog.getPathname();
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

export default clone;
