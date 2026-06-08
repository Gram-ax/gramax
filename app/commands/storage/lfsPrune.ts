import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";
import { Command } from "../../types/Command";
import { ResponseKind } from "../../types/ResponseKind";

const lfsPrune: Command<{ catalogName: string }, void> = Command.create({
	path: "storage/lfsPrune",

	kind: ResponseKind.json,

	async do({ catalogName }) {
		const { wm } = this._app;
		const catalog = await wm.current().getContextlessCatalog(catalogName);

		assert(catalog, `Catalog ${catalogName} not found`);
		assert(catalog.repo instanceof WorkdirRepository, `Catalog ${catalogName} is supposed to be WorkdirRepository`);

		await catalog.repo.lfsPrune();
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default lfsPrune;
