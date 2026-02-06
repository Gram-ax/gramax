import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type { LfsOptions } from "@core/GitLfs/options";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";

const updateLfsOptions: Command<{ catalogName: string; opts: LfsOptions }, void> = Command.create({
	path: "versionControl/lfs/updateLfsOptions",
	kind: ResponseKind.json,

	async do({ catalogName, opts }) {
		const current = this._app.wm.current();
		const catalog = await current.getContextlessCatalog(catalogName);

		assert(opts, "opts shouldn't be null");
		assert(catalog?.repo, `catalog ${catalogName} not found`);
		assert(
			catalog?.repo instanceof WorkdirRepository,
			`catalog ${catalogName} has non-workdir repository. actual: ${catalog?.repo?.constructor.name}`,
		);

		if (opts.patterns) {
			const attributes = await catalog.repo.attributes();
			await attributes.setAttrMany(opts.patterns, "filter=lfs").save();
		}

		if (typeof opts.lazy === "boolean") {
			await catalog.repo.gvc.setConfigVal("lfs.lazy", { kind: "bool", val: !!opts.lazy });
			await RepositoryProvider.resetRepo();
		}
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const opts = body;
		return { ctx, catalogName, opts };
	},
});

export default updateLfsOptions;
