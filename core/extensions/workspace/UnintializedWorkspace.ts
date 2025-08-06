import type Context from "@core/Context/Context";
import FileStructure from "@core/FileStructue/FileStructure";
import type Repository from "@ext/git/core/Repository/Repository";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

export type UnintializedWorkspaceProps = {
	path: WorkspacePath;
	fs: FileStructure;
	rp: RepositoryProvider;
};

export default class UnintializedWorkspace {
	private _repos: Map<string, Repository> = new Map();

	constructor(private _path: WorkspacePath, private _fs: FileStructure, private _rp: RepositoryProvider) {}

	static async init({ path, fs, rp }: UnintializedWorkspaceProps) {
		const self = new UnintializedWorkspace(path, fs, rp);

		const dirs = await FileStructure.getCatalogDirs(self._fs.fp);

		await dirs.forEachAsync(async (dir) => {
			const repo = await self._rp.getRepositoryByPath(dir.path, self._fs.fp);
			self._repos.set(dir.path.toString(), repo);
		});

		return self;
	}

	path() {
		return this._path;
	}

	getRepositoryByName(name: string) {
		return this._repos.get(name);
	}

	getCatalogNames() {
		return Array.from(this._repos.keys());
	}

	async getSourceByCatalogName(ctx: Context, name: string) {
		const repo = this.getRepositoryByName(name);
		if (!repo) return null;

		const sourceName = await repo?.storage?.getSourceName?.();
		return this._rp.getSourceData(ctx, sourceName, this._path);
	}
}
