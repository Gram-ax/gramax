import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import FileStructure from "@core/FileStructue/FileStructure";
import type Repository from "@ext/git/core/Repository/Repository";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";

export type UnintializedWorkspaceProps = {
	path: WorkspacePath;
	fs: FileStructure;
	rp: RepositoryProvider;
};

export type CatalogSummary = {
	name: string;
} & Pick<CatalogProps, "title">;

export default class UnintializedWorkspace {
	private _repos: Map<string, Repository> = new Map();

	constructor(
		private _path: WorkspacePath,
		private _fs: FileStructure,
		private _rp: RepositoryProvider,
	) {}

	static async init({ path, fs, rp }: UnintializedWorkspaceProps) {
		const self = new UnintializedWorkspace(path, fs, rp);

		const dirs = await FileStructure.getCatalogDirs(self._fs.fp);

		await dirs.forEachAsync(async (dir) => {
			const repo = await self._rp.getRepositoryByPath(dir.path, self._fs.fp);
			self._repos.set(dir.path.toString(), repo);
		});

		return self;
	}

	getFileProvider() {
		return this._fs.fp;
	}

	path() {
		return this._path;
	}

	getRepositoryByName(name: string) {
		return this._repos.get(name);
	}

	getCatalogDirNames() {
		return Array.from(this._repos.keys());
	}

	async getCatalogSummary(): Promise<CatalogSummary[]> {
		const dirs = this.getCatalogDirNames();

		return await dirs.mapAsync(async (dir) => {
			const entry = await this._fs.getCatalogEntryByPath(new Path(dir));

			return {
				name: entry?.name || dir,
				title: entry?.props.title || entry?.name || dir,
			};
		});
	}

	async getSourceByCatalogName(ctx: Context, name: string) {
		const repo = this.getRepositoryByName(name);
		if (!repo) return null;

		const sourceName = await repo?.storage?.getSourceName?.();
		return this._rp.getSourceData(ctx, sourceName, this._path);
	}
}
