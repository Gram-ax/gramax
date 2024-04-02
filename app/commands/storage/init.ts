import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import assertStorageExists from "@ext/storage/logic/utils/assertStorageExists";
import StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const init: Command<{ catalogName: string; articlePath: Path; data: StorageData }, string> = Command.create({
	path: "storage/init",

	kind: ResponseKind.plain,

	async do({ catalogName, articlePath, data }) {
		const { lib, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;

		await assertStorageExists(data, this._app.conf.services.auth.url);
		const fp = lib.getFileProviderByCatalog(catalog);
		const repo = await rp.initNewRepository(catalog.getBasePath(), fp, data);
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
