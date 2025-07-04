import type Context from "@core/Context/Context";
import { createEventEmitter, Event, type EventArgs } from "@core/Event/EventEmitter";
import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type CatalogEvents from "@core/FileStructue/Catalog/CatalogEvents";
import type { CatalogFilesUpdated } from "@core/FileStructue/Catalog/CatalogEvents";
import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import FileStructure from "@core/FileStructue/FileStructure";
import ItemExtensions from "@core/FileStructue/Item/ItemExtensions";
import type YamlFileConfig from "@core/utils/YamlFileConfig";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import type { ItemRefStatus } from "@ext/Watchers/model/ItemStatus";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkspaceAssets from "@ext/workspace/WorkspaceAssets";
import { WorkspaceConfig, type WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceEventHandlers from "@ext/workspace/events/WorkspaceEventHandlers";

export type WorkspaceEvents = Event<"add-catalog", { catalog: Catalog }> &
	Event<"remove-catalog", { name: string }> &
	Event<"resolve-category", EventArgs<CatalogEvents, "resolve-category">> &
	Event<"catalog-changed", CatalogFilesUpdated> &
	Event<"on-catalog-resolve", { mutableCatalog: { catalog: Catalog }; name: string; metadata: string }> &
	Event<"on-catalog-entry-resolve", { mutableEntry: { entry: BaseCatalog }; name: string; metadata: string }> &
	Event<"on-entries-read", { mutableEntries: { entries: CatalogEntry[] } }> &
	Event<"config-updated">;

export type WorkspaceInitCallback = (workspace: Workspace) => void;

export type WorkspaceInitProps = {
	fs: FileStructure;
	rp: RepositoryProvider;
	path: WorkspacePath;
	config: YamlFileConfig<WorkspaceConfig>;
	assets: WorkspaceAssets;
	onInit?: WorkspaceInitCallback;
};

export class Workspace {
	private _entries = new Map<string, BaseCatalog>();
	private _events = createEventEmitter<WorkspaceEvents>();

	protected constructor(
		private _path: WorkspacePath,
		protected _config: YamlFileConfig<WorkspaceConfig>,
		private _fs: FileStructure,
		private _rp: RepositoryProvider,
		protected _assets: WorkspaceAssets,
	) {
		new WorkspaceEventHandlers(this, this._rp).mount();
	}

	static async init({ fs, rp, path, config, assets, onInit }: WorkspaceInitProps) {
		const entries = await fs.getCatalogEntries();
		const workspace = new this(path, config, fs, rp, assets);
		onInit?.(workspace);

		const mutableEntries = { entries };
		await workspace._events.emit("on-entries-read", { mutableEntries });

		fs.fp.watch(workspace._onItemChanged.bind(this));
		await workspace._initRepositories(mutableEntries.entries, fs.fp);
		return workspace;
	}

	get events() {
		return this._events;
	}

	path() {
		return this._path;
	}

	async config() {
		return Promise.resolve(this._config.inner());
	}

	async getCatalog(name: string, ctx: Context): Promise<ContextualCatalog> {
		const catalog = await this.getContextlessCatalog(name);
		return catalog?.ctx(ctx);
	}

	async getContextlessCatalog(name: string): Promise<Catalog> {
		const { name: n, metadata } = BaseCatalog.parseName(name);
		const catalog = await this._entries.get(n)?.upgrade("catalog", true);
		const mutableCatalog = { catalog };
		await this.events.emit("on-catalog-resolve", {
			mutableCatalog,
			name,
			metadata,
		});
		return mutableCatalog.catalog;
	}

	async refreshCatalog(name: string) {
		const catalog = await this.getContextlessCatalog(name);
		const entry = await this._fs.getCatalogByPath(catalog.basePath);
		this._entries.set(name, entry);
		await this._initRepositories([entry], this._fs.fp);
	}

	async getBaseCatalog(name: string): Promise<BaseCatalog> {
		const [n, metadata] = name?.split(":") ?? [name];
		const entry = this._entries.get(n);
		const mutableEntry = { entry };
		await this._events.emit("on-catalog-entry-resolve", { mutableEntry, name, metadata });
		return mutableEntry.entry;
	}

	getAllCatalogs(): Map<string, BaseCatalog> {
		return this._entries;
	}

	getFileStructure(): FileStructure {
		return this._fs;
	}

	getFileProvider() {
		return this.getFileStructure().fp;
	}

	getAssets() {
		return this._assets;
	}

	async removeCatalog(name: string, deleteFromFs = true) {
		if (deleteFromFs) {
			const catalog = await this.getContextlessCatalog(name);
			const fp = this.getFileProvider();
			const path = FileStructure.getCatalogPath(catalog);
			await fp.delete(path, false);
		}

		this._entries.delete(name);
		await this._events.emit("remove-catalog", { name });
	}

	addCatalogEntry(catalogEntry: CatalogEntry): void {
		this._entries.set(catalogEntry.name, catalogEntry);
	}

	async addCatalog(catalog: Catalog): Promise<void> {
		this._entries.set(catalog.name, catalog);
		const basePath = catalog.basePath;
		const fp = this.getFileProvider();
		catalog.setRepository(await this._rp.getRepositoryByPath(basePath, fp));

		catalog.events.on("files-changed", (update) => this.events.emit("catalog-changed", update));

		catalog.events.on("set-name", async ({ catalog, prev }) => {
			this._entries.delete(prev);
			await this.addCatalog(catalog);
		});

		catalog.events.on("resolve-category", (args) => this.events.emitSync("resolve-category", args));
		catalog.events.on("update", async (arg) => {
			const entry = await this._fs.getCatalogByPath(catalog.basePath);
			arg.catalog = entry;
			await this.addCatalog(entry);
		});

		await this._events.emit("add-catalog", { catalog });
	}

	private async _initRepositories(entries: BaseCatalog[], fp: FileProvider): Promise<void> {
		await Promise.all(
			entries.map(async (entry) => {
				const maybeEntry = entry.upgrade("entry");
				if (maybeEntry) maybeEntry.setLoadCallback((catalog) => this.addCatalog(catalog));
				entry.setRepository(await this._rp.getRepositoryByPath(new Path(entry.name), fp));
				this._rp.tryInitEntryCloningStatus(this._path, entry);
				this._entries.set(entry.name, entry);
			}),
		);
	}

	private async _onItemChanged(items: ItemRefStatus[]): Promise<void> {
		const catalogs = this.getAllCatalogs();

		const updated = new Map<Catalog, ItemRefStatus[]>();

		for (const item of items) {
			const name = item.ref.path.rootDirectory.removeExtraSymbols.value;
			const isCatalogRemoved = this._isCatalogWasRemoved(name, item);
			if (isCatalogRemoved || !catalogs.size) await this._addCatalogIfNeed(item);
			if (isCatalogRemoved) continue;

			const catalog = await catalogs.get(name).upgrade("catalog", true);

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
		if (!catalog || this._entries.has(catalog.name)) return;
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
