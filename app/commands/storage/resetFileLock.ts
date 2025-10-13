import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import assert from "assert";
import { Command } from "../../types/Command";

const resetFileLock: Command<{ catalogName: string }, void> = Command.create({
	path: "storage/resetFileLock",

	async do({ catalogName }) {
		const { wm, rp } = this._app;

		const catalog = await wm.current().getBaseCatalog(catalogName);
		assert(catalog.repo instanceof BrokenRepository);
		await catalog.repo.resetFileLock();

		const repo = await rp.getRepositoryByPath(catalog.basePath, wm.current().getFileProvider());
		catalog.setRepository(repo);
	},

	params(ctx, query) {
		return { catalogName: query.catalogName };
	},
});

export default resetFileLock;
