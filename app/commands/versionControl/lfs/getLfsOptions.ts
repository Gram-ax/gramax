import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import type { LfsOptions } from "@core/GitLfs/options";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";

const getLfsOptions: Command<{ catalogName: string }, LfsOptions> = Command.create({
	path: "versionControl/lfs/getLfsOptions",
	kind: ResponseKind.json,

	middlewares: [new DesktopModeMiddleware()],

	async do({ catalogName }) {
		const current = this._app.wm.current();
		const catalog = await current.getContextlessCatalog(catalogName);

		assert(catalog?.repo, `catalog ${catalogName} not found`);
		assert(
			catalog?.repo instanceof WorkdirRepository,
			`catalog ${catalogName} has non-workdir repository. actual: ${catalog?.repo?.constructor.name}`,
		);

		const isLazy = await catalog.repo.gvc.getConfigVal("lfs.lazy");

		const attributes = await catalog.repo.attributes();
		return { patterns: attributes.findPatternsByAttr("filter=lfs"), lazy: isLazy !== "false" };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getLfsOptions;
