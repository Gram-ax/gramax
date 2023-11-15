import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import VersionControlType from "@ext/VersionControl/model/VersionControlType";
import { MergeFile } from "@ext/git/actions/MergeConflictHandler/model/MergeFile";
import BaseGitMergeConflictResolver from "@ext/git/core/GitMergeConflictResolver/Base/BaseGitMergeConflictResolver";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { Command, ResponseKind } from "../../../types/Command";

const getFiles: Command<{ catalogName: string }, MergeFile[]> = Command.create({
	path: "versionControl/mergeConflict/getFiles",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware()],

	async do({ catalogName }) {
		const { lib } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		if (!catalog) return;
		const vc = await catalog.getVersionControl();
		if (vc.getType() !== VersionControlType.git) return;
		const fp = lib.getFileProviderByCatalog(catalog);
		const fs = lib.getFileStructureByCatalog(catalog);
		const baseGitMergeConflictResolver = new BaseGitMergeConflictResolver(
			vc as GitVersionControl,
			fp,
			vc.getPath(),
		);
		return baseGitMergeConflictResolver.getFilesToMerge(fs);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		return { ctx, catalogName };
	},
});

export default getFiles;
