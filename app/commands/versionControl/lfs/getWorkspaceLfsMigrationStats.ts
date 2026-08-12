import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import {
	getWorkspaceLfsMigrationStats as getStats,
	type WorkspaceLfsAffected,
} from "@ext/enterprise/lfs/workspaceLfsMigration";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import isCatalogReadOnly from "@ext/workspace/utils/isCatalogReadOnly";

export type WorkspaceLfsMigrationStats = WorkspaceLfsAffected;

const NONE: WorkspaceLfsMigrationStats = { fileCount: 0, totalSize: 0 };

const getWorkspaceLfsMigrationStats: Command<{ ctx: Context; catalogName: string }, WorkspaceLfsMigrationStats> =
	Command.create({
		path: "versionControl/lfs/getWorkspaceLfsMigrationStats",
		kind: ResponseKind.json,

		async do({ ctx, catalogName }) {
			const { rp, wm } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getContextlessCatalog(catalogName);

			if (!(catalog?.repo instanceof WorkdirRepository) || !catalog.repo.storage) return NONE;
			if (await isCatalogReadOnly(this._app, workspace, ctx, catalog)) return NONE;

			const data = rp.getSourceData(ctx, await catalog.repo.storage.getSourceName());
			if (!data) return NONE;

			return getStats(workspace, catalog);
		},

		params(ctx, q) {
			return { ctx, catalogName: q.catalogName };
		},
	});

export default getWorkspaceLfsMigrationStats;
