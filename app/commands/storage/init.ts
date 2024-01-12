import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../types/Command";

const init: Command<{ catalogName: string; data: StorageData }, void> = Command.create({
	path: "storage/init",

	kind: ResponseKind.none,

	async do({ catalogName, data }) {
		const { lib, rp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const fp = lib.getFileProviderByCatalog(catalog);
		const repo = await rp.initNewRepository(catalog.getBasePath(), fp, data);
		catalog.setRepo(repo, rp);
	},

	params(_, q, body) {
		const catalogName = q.catalogName;
		return { catalogName, data: body };
	},
});

export default init;
