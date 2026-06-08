import type { GcOptions } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";
import { Command } from "../../types/Command";
import { ResponseKind } from "../../types/ResponseKind";

const runGc: Command<{ catalogName: string } & GcOptions, void> = Command.create({
	path: "storage/runGc",

	kind: ResponseKind.json,

	async do({ catalogName, looseObjectsLimit, packFilesLimit }) {
		const { wm } = this._app;
		const catalog = await wm.current().getContextlessCatalog(catalogName);

		assert(catalog, `Catalog ${catalogName} not found`);
		assert(catalog.repo instanceof WorkdirRepository, `Catalog ${catalogName} is supposed to be WorkdirRepository`);

		await catalog.repo.gc({
			looseObjectsLimit,
			packFilesLimit,
		});
	},

	params(_, q) {
		return {
			catalogName: q.catalogName,
			looseObjectsLimit: q.looseObjectsLimit != null ? Number(q.looseObjectsLimit) : 1,
			packFilesLimit: q.packFilesLimit != null ? Number(q.packFilesLimit) : 0,
		};
	},
});

export default runGc;
