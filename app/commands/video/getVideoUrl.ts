import Path from "@core/FileProvider/Path/Path";
import convertToSharePointDir from "@ext/markdown/elements/video/logic/convertToSharePointDir";
import { Command, ResponseKind } from "../../types/Command";

const getUrl: Command<{ articlePath: Path; catalogName: string; path: string }, string> = Command.create({
	path: "video",

	kind: ResponseKind.json,

	async do({ articlePath, catalogName, path }) {
		const { lib, vur } = this._app;
		if (!vur) return;

		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		const itemRef = fp.getItemRef(articlePath);

		return await vur.getUrl(convertToSharePointDir(catalog, itemRef, path).toString());
	},

	params(ctx, q) {
		const path = q.path;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);

		return { ctx, path, catalogName, articlePath };
	},
});

export default getUrl;
