import { createEventEmitter, Event, type EventArgs } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type { Catalog, CatalogEvents, CatalogFilesUpdated } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import FileStructure from "@core/FileStructue/FileStructure";
import ItemExtensions from "@core/FileStructue/Item/ItemExtensions";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { WorkspaceConfig, type WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { FSCatalogsInitializedCallback } from "@ext/workspace/WorkspaceManager";

export type WorkspaceEvents = Event<"resolve-category", EventArgs<CatalogEvents, "resolve-category">> &
	Event<"catalog-changed", CatalogFilesUpdated>;

export type WorkspaceInitProps = {
	fs: FileStructure;
	rp: RepositoryProvider;
	path: WorkspacePath;
	config: YamlFileConfig<WorkspaceConfig>;
	rules?: FSCatalogsInitializedCallback[];
};

export class Workspace {
	private _entries = new Map<string, CatalogEntry>();
	private _events = createEventEmitter<WorkspaceEvents>();

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
		fs.fp.watch(workspace._onItemChanged.bind(this));
		await workspace._initRepositories(entries, fs.fp);
		return workspace;
	}

	get events() {
		return this._events;
	}

	path() {
		return this._path;
	}

	config() {
		return this._config.inner();
	}

	async getCatalog(name: string): Promise<Catalog> {
		const catalog = await this._entries.get(name)?.load();
		return catalog;
	}

	async refreshCatalog(name: string) {
		const catalog = await this.getCatalog(name);
		const entry = await this._fs.getCatalogByPath(catalog.getBasePath());
		this._entries.set(name, entry);
		await this._initRepositories([entry], this._fs.fp);
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

	async removeCatalog(name: string, deleteFromFs = true) {
		if (deleteFromFs) {
			const catalog = await this.getCatalog(name);
			const fp = this.getFileProvider();
			const path = FileStructure.getCatalogPath(catalog);
			await fp.delete(path, true);
		}
		this._entries.delete(name);
	}

	addCatalogEntry(catalogEntry: CatalogEntry): void {
		this._entries.set(catalogEntry.getName(), catalogEntry);
	}

	async addCatalog(catalog: Catalog): Promise<void> {
		this._entries.set(catalog.getName(), catalog);
		const basePath = catalog.getBasePath();
		const fp = this.getFileProvider();
		catalog.setRepo(await this._rp.getRepositoryByPath(basePath, fp), this._rp);

		catalog.events.on("files-changed", (update) => this.events.emit("catalog-changed", update));

		catalog.events.on("set-name", async ({ catalog, prev }) => {
			this._entries.delete(prev);
			await this.addCatalog(catalog);
		});

		catalog.events.on("resolve-category", (args) => this.events.emitSync("resolve-category", args));
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

	private async _onItemChanged(items: ItemRefStatus[]): Promise<void> {
		const catalogs = this.getCatalogEntries();

		const updated = new Map<Catalog, ItemRefStatus[]>();

		for (const item of items) {
			const name = item.ref.path.rootDirectory.removeExtraSymbols.value;
			const isCatalogRemoved = this._isCatalogWasRemoved(name, item);
			if (isCatalogRemoved || !catalogs.size) await this._addCatalogIfNeed(item);
			if (isCatalogRemoved) continue;

			const catalog = await catalogs.get(name).load();

			if (!(catalog && ItemExtensions.includes(item.ref.path.extension))) continue;

			if (!updated.has(catalog)) updated.set(catalog, []);
			updated.get(catalog).push(item);
		}

		for (const [catalog, items] of updated.entries()) await this.events.emit("catalog-changed", { catalog, items });
	}

	private async _addCatalogIfNeed({ ref, status }: ItemRefStatus) {
		if (!FileStructure.isCatalog(ref.path) || (status !== FileStatus.new && status !== FileStatus.modified)) return;
		const fs = this.getFileStructure();
		const catalog = await fs.getCatalogEntryByPath(ref.path.rootDirectory);
		if (!catalog || this._entries.has(catalog.getName())) return;
		await this.addCatalog(await catalog.load());
	}

	private _isCatalogWasRemoved(catalogName: string, { ref, status }: ItemRefStatus) {
		const catalogDirIsRemoved = ref.path.compare(new Path(catalogName));
		const catalogRootFileIsRemoved = FileStructure.isCatalog(ref.path);

		const catalogIsRemoved = (catalogDirIsRemoved || catalogRootFileIsRemoved) && status == FileStatus.delete;
		if (catalogIsRemoved && this._entries.has(catalogName)) this._entries.delete(catalogName);

		return catalogIsRemoved;
	}
}
