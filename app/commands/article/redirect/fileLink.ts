import Path from "@core/FileProvider/Path/Path";
import { Command, ResponseKind } from "../../../types/Command";

const fileLink: Command<{ catalogName: string; articlePath: Path }, string> = Command.create({
	path: "article/redirect/fileLink",

	kind: ResponseKind.redirect,

	async do({ catalogName, articlePath }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		const itemRef = fp.getItemRef(articlePath);
		const path = catalog?.getRelativeRepPath(itemRef) ?? null;
		const { versionControl } = await (await catalog.getVersionControl()).getVersionControlContainsItem(path);

		return await catalog.getStorage().getFileLink(path, await versionControl.getCurrentBranch());
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default fileLink;
