import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

export default class ScopedCatalogs {
	private _scopedCatalogs: Map<string, Catalog> = new Map();
	private _gitTreeFps: Map<string, GitTreeFileProvider> = new Map();

	async getScopedCatalog(catalogPath: Path, fs: FileStructure, scope: TreeReadScope, unmountAfterInit: boolean) {
		const scopedPath = GitTreeFileProvider.scoped(catalogPath, scope);
		if (!this._scopedCatalogs.has(scopedPath.value)) {
			const gitTreeFileProvider = this._getGitTreeFileProvider(catalogPath, fs.fp);
			fs.fp.mount(scopedPath, gitTreeFileProvider);
			const scopedCatalog = await fs.getCatalogByPath(scopedPath, false);
			if (unmountAfterInit) fs.fp.unmount(scopedPath);

			this._scopedCatalogs.set(scopedPath.value, scopedCatalog);
		}
		return this._scopedCatalogs.get(scopedPath.value);
	}

	deleteScopedCatalog(catalogPath: Path) {
		this._scopedCatalogs.delete(catalogPath.value);
	}

	mountScopes(catalogPath: Path, fp: MountFileProvider, ...scopes: TreeReadScope[]) {
		scopes.forEach((scope) => {
			const scopedPath = GitTreeFileProvider.scoped(catalogPath, scope);
			fp.mount(scopedPath, this._getGitTreeFileProvider(catalogPath, fp));
		});
	}

	unmountScopes(catalogPath: Path, fp: MountFileProvider, ...scopes: TreeReadScope[]) {
		scopes.forEach((scope) => {
			const scopedPath = GitTreeFileProvider.scoped(catalogPath, scope);
			fp.unmount(scopedPath);
		});
	}

	private _getGitTreeFileProvider(catalogPath: Path, fp: MountFileProvider): GitTreeFileProvider {
		if (!this._gitTreeFps.has(catalogPath.value)) {
			const gitTreeFp = new GitTreeFileProvider(new GitCommands(fp.default(), catalogPath));
			this._gitTreeFps.set(catalogPath.value, gitTreeFp);
		}
		return this._gitTreeFps.get(catalogPath.value);
	}
}
