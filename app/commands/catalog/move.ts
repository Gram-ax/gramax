import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import assert from "assert";
import { Command } from "../../types/Command";

export type CatalogMoveConflictResolution = "keepBoth" | "replace";

const move: Command<
	{
		ctx: Context;
		sourceCatalogName: string;
		sourceCatalogAddPostfix?: string;
		targetCatalogName: string;
		targetWorkspacePath: WorkspacePath;
		conflictResolution: CatalogMoveConflictResolution;
	},
	void
> = Command.create({
	path: "catalog/move",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({
		ctx,
		sourceCatalogName,
		sourceCatalogAddPostfix,
		targetCatalogName,
		targetWorkspacePath,
		conflictResolution,
	}) {
		const { wm, resourceUpdaterFactory } = this._app;

		const targetWorkspace = await wm.getUnintializedWorkspace(targetWorkspacePath);
		const sourceWorkspace = wm.current();

		const sourceWorkspaceConfig = await sourceWorkspace.config();

		assert(
			!sourceWorkspaceConfig.enterprise?.gesUrl,
			`can not move catalog out of enterprise workspace: ${sourceWorkspace.path()}`,
		);

		assert(targetWorkspace, `target workspace not found: ${targetWorkspacePath}`);

		const hasCatalogInSourceWorkspace = await sourceWorkspace.getContextlessCatalog(sourceCatalogName);
		const hasCatalogInTargetWorkspace = targetWorkspace.getCatalogDirNames().includes(targetCatalogName);

		assert(hasCatalogInSourceWorkspace, `catalog not found in source workspace: ${sourceCatalogName}`);
		assert(
			!(conflictResolution === "keepBoth" && hasCatalogInTargetWorkspace),
			`catalog ${targetCatalogName} (source: ${sourceCatalogName}) already exists in target workspace ${targetWorkspacePath}. This is an error and another name should have been picked before calling this command with '${conflictResolution}'`,
		);

		if (conflictResolution === "replace") {
			await targetWorkspace.getFileProvider().delete(new Path(targetCatalogName));
		}

		const sourceFp = sourceWorkspace.getFileProvider().at(Path.empty);
		const targetFp = targetWorkspace.getFileProvider().at(Path.empty);

		assert(
			sourceFp instanceof DiskFileProvider,
			`moveCatalog supports only DiskFileProfider and source (current) workspace FileProvider must be one; got ${sourceFp.constructor.name}`,
		);

		assert(
			targetFp instanceof DiskFileProvider,
			`moveCatalog supports only DiskFileProfider and target workspace FileProvider must be one; got ${targetFp.constructor.name}`,
		);

		const sourceCatalog = await wm.current().getBaseCatalog(sourceCatalogName);

		await sourceCatalog.updateProps(
			{
				title: sourceCatalog.props.title + (sourceCatalogAddPostfix || ""),
			},
			resourceUpdaterFactory.withContext(ctx),
		);

		await wm.current().removeCatalog(sourceCatalogName, false);
		await sourceFp.move(new Path(sourceCatalogName), new Path(targetCatalogName), targetFp);
	},

	params(ctx, q, body) {
		const sourceCatalogName = (q.sourceCatalogName || body?.sourceCatalogName) as string;
		const targetCatalogName = (q.targetCatalogName || body?.targetCatalogName) as string;
		const targetWorkspacePath = (q.targetWorkspacePath || body?.targetWorkspacePath) as WorkspacePath;
		const conflictResolution = (q.conflictResolution ||
			body?.conflictResolution ||
			"keepBoth") as CatalogMoveConflictResolution;
		const sourceCatalogAddPostfix = (q.sourceCatalogAddPostfix || body?.sourceCatalogAddPostfix) as string;

		return {
			ctx,
			sourceCatalogName,
			targetCatalogName,
			targetWorkspacePath,
			conflictResolution,
			sourceCatalogAddPostfix,
		};
	},
});

export default move;
