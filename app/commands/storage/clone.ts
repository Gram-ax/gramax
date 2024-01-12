import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import Path from "@core/FileProvider/Path/Path";
import StorageСhecker from "@ext/storage/logic/StorageСhecker";
import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../types/Command";

const clone: Command<
	{ path: Path; data: StorageData; skipCheck?: boolean; recursive?: boolean; branch?: string },
	string
> = Command.create({
	path: "storage/clone",

	kind: ResponseKind.plain,

	middlewares: [new AuthorizeMiddleware()],

	async do({ path, data, recursive, skipCheck, branch }) {
		const { lib, rp } = this._app;

		const fs = lib.getFileStructure();
		const fp = lib.getFileProvider();
		const sc = new StorageСhecker();
		await rp.cloneNewRepository(
			fp,
			path,
			data,
			recursive,
			skipCheck ? branch : branch ?? (await sc.getCorrectBranch(data)),
		);
		const entry = await fs.getCatalogEntryByPath(path);
		const catalog = entry
			? await entry.load()
			: await fs.createCatalog(
					{
						title: path.name,
						url: path.name,
					},
					new Path("docs"),
			  );
		await lib.addCatalog(catalog);
		return catalog.getName();
	},

	params(_, q, body) {
		return {
			path: new Path(q.path),
			data: body,
			recursive: q.recursive ? q.recursive === "true" : null,
			branch: q.branch ? q.branch : null,
			skipCheck: q.skipCheck == "true",
		};
	},
});

export default clone;
