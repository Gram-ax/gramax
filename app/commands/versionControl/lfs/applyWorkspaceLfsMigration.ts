import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { applyWorkspaceLfsMigration as applyCore } from "@ext/enterprise/lfs/workspaceLfsMigration";
import MergeConflictCaller from "@ext/git/actions/MergeConflictHandler/model/MergeConflictCaller";
import type MergeData from "@ext/git/actions/MergeConflictHandler/model/MergeData";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import isCatalogReadOnly from "@ext/workspace/utils/isCatalogReadOnly";

export type ApplyWorkspaceLfsMigrationResult = { mergeData: MergeData };

const OK: ApplyWorkspaceLfsMigrationResult = { mergeData: { ok: true } };

const applyWorkspaceLfsMigration: Command<{ ctx: Context; catalogName: string }, ApplyWorkspaceLfsMigrationResult> =
	Command.create({
		path: "versionControl/lfs/applyWorkspaceLfsMigration",
		kind: ResponseKind.json,

		async do({ ctx, catalogName }) {
			const { rp, wm } = this._app;
			const workspace = wm.current();
			const catalog = await workspace.getContextlessCatalog(catalogName);

			if (!(catalog?.repo instanceof WorkdirRepository) || !catalog.repo.storage) return OK;
			if (await isCatalogReadOnly(this._app, workspace, ctx, catalog)) return OK;

			const data = rp.getSourceData<GitSourceData>(ctx, await catalog.repo.storage.getSourceName());
			if (!data) return OK;

			// Sync before migrating: the divergence was detected during an earlier sync and the user may
			// have left the dialog open for a while. Pulling now puts the service commit on top of the
			// current remote head, so the push can't be rejected and another client's `.gitattributes`
			// can't end up conflicting with ours. Conflicts from that pull abort the migration — the
			// divergence is still there, so it is re-prompted after the user resolves them.
			await catalog.repo.storage.fetch(data, false, false);
			if ((await catalog.repo.storage.getSyncCount()).pull) {
				const { mergeData: mergeFiles } = await catalog.repo.sync({ data });
				if (mergeFiles.length) {
					const state = await catalog.repo.getState();
					return {
						mergeData: {
							ok: false,
							mergeFiles,
							reverseMerge: (state.inner as RepositoryMergeConflictState).data?.reverseMerge,
							caller: MergeConflictCaller.Sync,
						},
					};
				}
			}

			await applyCore(workspace, catalog, data);
			return OK;
		},

		params(ctx, q) {
			return { ctx, catalogName: q.catalogName };
		},
	});

export default applyWorkspaceLfsMigration;
