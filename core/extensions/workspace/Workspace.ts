import { DOC_ROOT_REGEXP } from "@app/config/const";
import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type { Catalog, ChangeCatalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import FileStructure from "@core/FileStructue/FileStructure";
import ItemExtensions from "@core/FileStructue/Item/ItemExtensions";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { WorkspaceConfig, type WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { CatalogChangedCallback, FSCatalogsInitializedCallback } from "@ext/workspace/WorkspaceManager";

export type WorkspaceInitProps = {
	fs: FileStructure;
	rp: RepositoryProvider;
	path: WorkspacePath;
	config: YamlFileConfig<WorkspaceConfig>;
	rules?: FSCatalogsInitializedCallback[];
};

export class Workspace {
	private _entries = new Map<string, CatalogEntry>();
	private _onChanged: CatalogChangedCallback[] = [];

	private constructor(
		private _path: WorkspacePath,
		private _config: YamlFileConfig<WorkspaceConfig>,
		private _fs: FileStructure,
		private _rp: RepositoryProvider,
	) {}

	static async init({ fs, rp, rules, path, config }: WorkspaceInitProps) {
		const entries = await fs.getCatalogEntries();
		rules?.forEach((rule) => rule(fs.fp, entries));
		const workspace = new this(path, config, fs, rp);
		fs.fp.watch(workspace._onItemChange.bind(this));
		await workspace._initRepositories(entries, fs.fp);
		workspace.addOnChangeRule(workspace._checkCatalogPropsChanged.bind(workspace));

		return workspace;
	}

	path() {
		return this._path;
	}

	config() {
		return this._config.inner();
	}

	addOnChangeRule(callback: CatalogChangedCallback): void {
		this._onChanged.push(callback);
	}

	async getCatalog(name: string): Promise<Catalog> {
		return await this._entries.get(name)?.load();
	}

	getCatalogEntry(name: string): CatalogEntry {
		return this._entries.get(name);
	}

	getCatalogEntries(): Map<string, CatalogEntry> {
		return this._entries;
	}

	getFileStructure(): FileStructure {
		return this._fs;
	}

	getFileProvider(): FileProvider {
		return this.getFileStructure().fp;
	}

	async removeCatalog(name: string) {
		const catalog = await this.getCatalog(name);
		const fp = this.getFileProvider();
		const path = FileStructure.getCatalogPath(catalog);
		await fp.delete(path);
		this._entries.delete(name);
	}

	async addCatalog(catalog: Catalog): Promise<void> {
		this._entries.set(catalog.getName(), catalog);
		const basePath = catalog.getBasePath();
		const fp = this.getFileProvider();
		catalog.setRepo(await this._rp.getRepositoryByPath(basePath, fp), this._rp);
		catalog.watch(this._onCatalogChange.bind(this));
		catalog.onUpdateName(async (prevName, catalog) => {
			this._entries.delete(prevName);
			await this.addCatalog(catalog);
		});
	}

	private async _initRepositories(entries: CatalogEntry[], fp: FileProvider): Promise<void> {
		await Promise.all(
			entries.map(async (entry) => {
				entry.withOnLoad((catalog) => this.addCatalog(catalog));
				entry.setRepo(await this._rp.getRepositoryByPath(new Path(entry.getName()), fp), this._rp);
				this._entries.set(entry.getName(), entry);
			}),
		);
	}

	private async _onCatalogChange(items: ChangeCatalog[]): Promise<void> {
		await Promise.all(this._onChanged.map(async (rule) => rule(items)));
	}

	private async _onItemChange(changeItems: ItemStatus[]): Promise<void> {
		const catalogs = this.getCatalogEntries();
		let changeCatalogs: ChangeCatalog[] = await Promise.all(
			changeItems.map(async ({ itemRef, type }) => {
				let catalog = null;
				const catalogName = itemRef.path.rootDirectory.removeExtraSymbols.value;
				if (!catalogs.size) await this._checkCatalogAddition(itemRef, type);
				for (const c of catalogs.values()) {
					if (c.getName() == catalogName && !this._checkCatalogRemoved(itemRef, type, catalogName)) {
						catalog = c;
					} else {
						await this._checkCatalogAddition(itemRef, type);
					}
				}
				return { catalog, itemRef, type };
			}),
		);
		changeCatalogs = this._filterItems(changeCatalogs);

		const changedCatalogs: Catalog[] = [];
		changeCatalogs.forEach((changeCatalog: ChangeCatalog) => {
			if (!changedCatalogs.includes(changeCatalog.catalog)) changedCatalogs.push(changeCatalog.catalog);
		});

		await Promise.all(changedCatalogs.map((catalog: Catalog) => catalog.update(this._rp)));

		if (changeCatalogs.length) await this._onCatalogChange(changeCatalogs);
	}

	private _filterItems(items: ChangeCatalog[]): ChangeCatalog[] {
		return items.filter((item) => {
			const extension = item.itemRef.path.extension;
			return item.catalog && ItemExtensions.some((ext) => ext === extension);
		});
	}

	private async _checkCatalogAddition(itemRef: ItemRef, type: FileStatus): Promise<void> {
		if (!FileStructure.isCatalog(itemRef.path) || (type !== FileStatus.new && type !== FileStatus.modified)) return;
		const fs = this.getFileStructure();
		const catalog = await fs.getCatalogEntryByPath(itemRef.path.rootDirectory);
		if (!catalog || this._entries.has(catalog.getName())) return;
		await this.addCatalog(await catalog.load());
	}

	private async _checkCatalogPropsChanged(items: ChangeCatalog[]) {
		if (!items.find((c) => DOC_ROOT_REGEXP.test(c.itemRef.path.nameWithExtension))) return;
		const catalog = items[0].catalog;
		const entry = await this.getFileStructure().getCatalogEntryByPath(catalog.getBasePath());
		this._entries.delete(catalog.getName());
		await this.addCatalog(await entry.load());
	}

	private _checkCatalogRemoved(itemRef: ItemRef, type: FileStatus, catalogName: string): boolean {
		const catalogDirIsRemoved = itemRef.path.compare(new Path(catalogName));
		const catalogRootFileIsRemoved = FileStructure.isCatalog(itemRef.path);

		const catalogIsRemoved = (catalogDirIsRemoved || catalogRootFileIsRemoved) && type == FileStatus.delete;
		if (catalogIsRemoved && this._entries.has(catalogName)) this._entries.delete(catalogName);

		return catalogIsRemoved;
	}
}
