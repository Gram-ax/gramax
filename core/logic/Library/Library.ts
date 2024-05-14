import CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { ItemStatus } from "@ext/Watchers/model/ItemStatus";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import Path from "../FileProvider/Path/Path";
import FileProvider from "../FileProvider/model/FileProvider";
import { Catalog, ChangeCatalog } from "../FileStructue/Catalog/Catalog";
import FileStructure from "../FileStructue/FileStructure";
import ItemExtensions from "../FileStructue/Item/ItemExtensions";
import { DOC_ROOT_REGEXP } from "@app/config/const";

export type FSCreatedCallback = (fs: FileStructure) => void;
export type CatalogChangedCallback = (items: ChangeCatalog[]) => void | Promise<void>;
export type FSCatalogsInitalizedCallback = (fp: FileProvider, catalogs: CatalogEntry[]) => void;

export default class Library {
	private _entries = new Map<string, CatalogEntry>();
	private _structures = new Map<string, FileStructure>();
	private _onChanged: CatalogChangedCallback[] = [];

	constructor(private _rp: RepositoryProvider, private _isServerApp: boolean) {
		this.addOnChangeRule(this._checkCatalogPropsChanged.bind(this));
	}

	async addFileProvider(
		fp: FileProvider,
		callback?: FSCreatedCallback,
		rules?: FSCatalogsInitalizedCallback[],
	): Promise<FileStructure> {
		const fs = new FileStructure(fp, this._isServerApp);
		callback?.(fs);
		fp.watch(this._onItemChange.bind(this));
		this._structures.set(fp.storageId, fs);
		const entries = await fs.getCatalogEntries();
		rules?.forEach((rule) => rule(fp, entries));
		await this._initRepositories(entries, fp);
		return fs;
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

	getFileStructure(storageId?: string): FileStructure {
		return storageId ? this._structures.get(storageId) : this._structures.values().next().value;
	}

	getFileStructureByCatalog(catalog: Catalog): FileStructure {
		return this.getFileStructure(this._getStorageIdByCatalog(catalog));
	}

	getFileProvider(storageId?: string): FileProvider {
		return this.getFileStructure(storageId).fp;
	}

	getFileProviderByCatalog(catalog: Catalog): FileProvider {
		return this.getFileProvider(catalog.getRootCategoryRef().storageId);
	}

	async removeCatalog(catalogName: string) {
		const catalog = await this.getCatalog(catalogName);
		const fp = this.getFileProviderByCatalog(catalog);
		const path = FileStructure.getCatalogPath(catalog);
		await fp.delete(path);
		this._entries.delete(catalogName);
	}

	async addCatalog(catalog: Catalog): Promise<void> {
		this._entries.set(catalog.getName(), catalog);
		const basePath = catalog.getBasePath();
		const fp = this.getFileProvider(catalog.getRootCategoryRef().storageId);
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

	private _getStorageIdByCatalog(catalog: Catalog) {
		return catalog.getRootCategoryRef().storageId;
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
		const fs = this.getFileStructure(itemRef.storageId);
		const catalog = await fs.getCatalogEntryByPath(itemRef.path.rootDirectory);
		if (!catalog || this._entries.has(catalog.getName())) return;
		await this.addCatalog(await catalog.load());
	}

	private async _checkCatalogPropsChanged(items: ChangeCatalog[]) {
		if (!items.find((c) => DOC_ROOT_REGEXP.test(c.itemRef.path.nameWithExtension))) return;
		const catalog = items[0].catalog;
		const entry = await this.getFileStructureByCatalog(catalog).getCatalogEntryByPath(catalog.getBasePath());
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
