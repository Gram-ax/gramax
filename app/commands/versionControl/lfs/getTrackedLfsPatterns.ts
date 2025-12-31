import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import assert from "assert";

export type GetTrackedLfsPatternsResult = {
	patterns: string[];
};

const getTrackedLfsPatterns: Command<{ catalogName: string }, GetTrackedLfsPatternsResult> = Command.create({
	path: "versionControl/lfs/getTrackedLfsPatterns",
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

		const attributes = await catalog.repo.attributes();
		return { patterns: attributes.findPatternsByAttr("filter=lfs") };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getTrackedLfsPatterns;
