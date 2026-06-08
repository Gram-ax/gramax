import type { StorageStats } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";
import { Command } from "../../types/Command";
import { ResponseKind } from "../../types/ResponseKind";

const getStorageStats: Command<{ catalogName: string }, StorageStats> = Command.create({
	path: "storage/getStorageStats",

	kind: ResponseKind.json,

	async do({ catalogName }) {
		const { wm } = this._app;
		const catalog = await wm.current().getContextlessCatalog(catalogName);

		assert(catalog, `Catalog ${catalogName} not found`);
		assert(catalog.repo instanceof WorkdirRepository, `Catalog ${catalogName} is supposed to be WorkdirRepository`);

		return catalog.repo.storageStats();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default getStorageStats;
