import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";

const updateTrackedLfsPatterns: Command<{ catalogName: string; patterns: string[] }, void> = Command.create({
	path: "versionControl/lfs/updateTrackedLfsPatterns",
	kind: ResponseKind.json,

	async do({ catalogName, patterns }) {
		const current = this._app.wm.current();
		const catalog = await current.getContextlessCatalog(catalogName);

		assert(catalog?.repo, `catalog ${catalogName} not found`);
		assert(
			catalog?.repo instanceof WorkdirRepository,
			`catalog ${catalogName} has non-workdir repository. actual: ${catalog?.repo?.constructor.name}`,
		);

		const attributes = await catalog.repo.attributes();
		await attributes.setAttrMany(patterns, "filter=lfs").save();
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const patterns = body;
		return { ctx, catalogName, patterns };
	},
});

export default updateTrackedLfsPatterns;
