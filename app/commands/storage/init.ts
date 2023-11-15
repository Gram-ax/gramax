import VersionControlType from "@ext/VersionControl/model/VersionControlType";
import StorageData from "@ext/storage/models/StorageData";
import { Command, ResponseKind } from "../../types/Command";

const init: Command<{ catalogName: string; data: StorageData; vcType: VersionControlType }, void> = Command.create({
	path: "storage/init",

	kind: ResponseKind.none,

	async do({ catalogName, data, vcType }) {
		const { lib, vcp, sp } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const fp = lib.getFileProviderByCatalog(catalog);

		const vc = await vcp.initVersionControl(catalog.getBasePath(), vcType, fp, data.source);
		catalog.setVersionControl(sp, vcp, vc);

		const storage = await sp.initNewStorage(fp, catalog.getBasePath(), data);
		catalog.setStorage(storage);
	},

	params(_, q, body) {
		const catalogName = q.catalogName;
		return { catalogName, data: body, vcType: VersionControlType.git };
	},
});

export default init;
