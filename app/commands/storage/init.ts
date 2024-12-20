import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import { initEnterpriseStorage } from "@ext/enterprise/utils/initEnterpriseStorage";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const init: Command<{ catalogName: string; articlePath: Path; data: StorageData }, string> = Command.create({
	path: "storage/init",

	kind: ResponseKind.plain,

	async do({ catalogName, articlePath, data }) {
		const { rp, wm, em } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) return;

		await initEnterpriseStorage(em.getConfig().gesUrl, data);

		await makeSourceApi(data.source, workspace.config().services?.auth?.url).assertStorageExist(data);
		const fp = workspace.getFileProvider();
		const repo = await rp.initNew(catalog.basePath, fp, data);
		catalog.setRepository(repo);
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
