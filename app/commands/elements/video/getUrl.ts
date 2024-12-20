import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import convertToSharePointDir from "@ext/markdown/elements/video/logic/convertToSharePointDir";
import { Command } from "../../../types/Command";
import type Context from "@core/Context/Context";

const getUrl: Command<{ ctx: Context; articlePath: Path; catalogName: string; path: string }, string> = Command.create({
	path: "elements/video/getUrl",

	kind: ResponseKind.json,

	async do({ ctx, articlePath, catalogName, path }) {
		const { wm, vur } = this._app;
		if (!vur) return;

		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const fp = workspace.getFileProvider();
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
