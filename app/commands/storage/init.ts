import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const init: Command<{ catalogName: string; articlePath: Path; data: StorageData }, string> = Command.create({
	path: "storage/init",

	kind: ResponseKind.plain,

	async do({ catalogName, articlePath, data }) {
		const { rp, wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return;

		await makeSourceApi(data.source, workspace.config().services?.auth?.url).assertStorageExist(data);
		const fp = workspace.getFileProvider();
		const repo = await rp.initNew(catalog.getBasePath(), fp, data);
		catalog.setRepo(repo, rp);
		const item = catalog.findItemByItemPath(articlePath);
		return await catalog.getPathname(item);
	},

	params(_, q, body) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { catalogName, articlePath, data: body };
	},
});

export default init;
