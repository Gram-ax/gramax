import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const getBrotherNames: Command<{ articlePath: Path; ctx: Context }, string[]> = Command.create({
	path: "article/features/getBrotherNames",

	kind: ResponseKind.json,

	middlewares: [],

	async do({ articlePath }) {
		const workspace = this._app.wm.current();
		const fp = workspace.getFileProvider();
		const items = await fp.getItems(articlePath.parentDirectoryPath);
		return items.map((i) => "./" + i.name);
	},

	params(ctx, q) {
		const articlePath = new Path(q.articlePath);
		return { ctx, articlePath };
	},
});

export default getBrotherNames;
