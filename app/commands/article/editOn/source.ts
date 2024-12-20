import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";

const source: Command<{ catalogName: string; articlePath: Path }, string> = Command.create({
	path: "article/editOn/source",

	kind: ResponseKind.plain,

	async do({ catalogName, articlePath }) {
		const workspace = this._app.wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;
		if (!articlePath.startsWith(catalog.basePath)) return;
		const fp = workspace.getFileProvider();
		const itemRef = fp.getItemRef(articlePath);
		const path = catalog.getRepositoryRelativePath(itemRef);
		const { gitVersionControl } = await catalog.repo.gvc.getGitVersionControlContainsItem(path);

		return await catalog.repo.storage.getFileLink(path, await gitVersionControl.getCurrentBranch());
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath };
	},
});

export default source;
