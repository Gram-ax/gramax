import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import Repository from "@ext/git/core/Repository/Repository";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { addScopeToPath } from "@ext/versioning/utils";

export default class ScopedCatalogs {
	private _scopedCatalogs: Map<string, Catalog> = new Map();
	private _gitTreeFps: Map<string, GitTreeFileProvider> = new Map();

	constructor(private _repo: Repository) {}

	async getScopedCatalog(catalogPath: Path, fs: FileStructure, scope: TreeReadScope) {
		const commitScope = await convertScopeToCommitScope(scope, this._repo.gvc);
		const scopedPath = GitTreeFileProvider.scoped(catalogPath, commitScope);
		if (!this._scopedCatalogs.has(scopedPath.value)) {
			const gitTreeFileProvider = this._getGitTreeFileProvider(catalogPath, fs.fp);
			fs.fp.mount(scopedPath, gitTreeFileProvider);
			const scopedCatalog = await fs.getCatalogByPath(scopedPath, false);
			scopedCatalog.setRepository(this._repo, false);

			this._scopedCatalogs.set(scopedPath.value, scopedCatalog);
		}
		return this._scopedCatalogs.get(scopedPath.value);
	}

	invalidateCache(fs: FileStructure) {
		this._scopedCatalogs.keys().forEach((scopedPath) => fs.fp.unmount(new Path(scopedPath)));
		this._scopedCatalogs.clear();
		this._gitTreeFps.clear();
	}

	private _getGitTreeFileProvider(catalogPath: Path, fp: MountFileProvider): GitTreeFileProvider {
		const realPath = new Path(addScopeToPath(catalogPath.value));
		if (!this._gitTreeFps.has(realPath.value)) {
			const gitTreeFp = new GitTreeFileProvider(new GitCommands(fp.default(), realPath));
			this._gitTreeFps.set(realPath.value, gitTreeFp);
		}
		return this._gitTreeFps.get(realPath.value);
	}
}
