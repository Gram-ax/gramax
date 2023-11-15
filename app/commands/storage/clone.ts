import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageСhecker from "@ext/storage/logic/StorageСhecker";
import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../types/Command";

const clone: Command<{ path: Path; data: StorageData; recursive?: boolean; branch?: string }, string> = Command.create({
	path: "storage/clone",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ path, data, recursive, branch }) {
		const { lib, sp } = this._app;

		const sc = new StorageСhecker();
		const fs = lib.getFileStructure();
		const fp = lib.getFileProvider();
		await sp.cloneNewStorage(fp, sc, path, data, recursive, branch);
		const catalog = await fs.getCatalogByPath(path);
		if (!catalog) return;
		await lib.addCatalog(catalog);
		return catalog.getName();
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
