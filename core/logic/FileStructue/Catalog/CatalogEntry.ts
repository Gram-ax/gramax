import Path from "@core/FileProvider/Path/Path";
import { Catalog, type CatalogProps } from "@core/FileStructue/Catalog/Catalog";
import { FSLazyLoadCatalog } from "@core/FileStructue/FileStructure";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import PathnameData from "@core/RouterPath/model/PathnameData";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { CatalogErrors } from "@ext/healthcheck/logic/Healthcheck";
import IPermission from "@ext/security/logic/Permission/IPermission";
import Permission from "@ext/security/logic/Permission/Permission";
// TEMP:
// import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

type CatalogOnLoad = (catalog: Catalog) => void | Promise<void>;

type CatalogEntryProps = {
	name: string;
	rootCaterogyRef: ItemRef;
	basePath: Path;
	props: CatalogProps;
	errors: CatalogErrors;
	load: FSLazyLoadCatalog;
	isServerApp: boolean;
};

export default class CatalogEntry {
	protected _onLoad?: CatalogOnLoad;
	protected _perms: IPermission;
	protected _isLoad = false;
	protected _name: string;
	protected _repo: Repository = {} as Repository;
	private _rootCaterogyRef: ItemRef;
	private _rootCaterogyPath: Path;
	protected _basePath: Path;
	protected _props: CatalogProps;
	protected _errors: CatalogErrors;
	protected _load: FSLazyLoadCatalog;
	protected _isServerApp: boolean;

	constructor(init: CatalogEntryProps) {
		this._name = init.name;
		this._rootCaterogyRef = init.rootCaterogyRef;
		this._rootCaterogyPath = init.rootCaterogyRef.path.parentDirectoryPath;
		this._basePath = init.basePath;
		this._props = init.props;
		this._errors = init.errors;
		this._load = init.load;
		this._perms = new Permission(this._props["private"]);
		this._isServerApp = init.isServerApp;
	}

	withOnLoad(callback: CatalogOnLoad): void {
		this._onLoad = callback;
	}

	get repo() {
		return this._repo;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	setRepo(value: Repository, _rp: RepositoryProvider) {
		this._repo = value;
	}

	async getPathname(item?: Item): Promise<string> {
		return this._isServerApp
			? Promise.resolve(item ? item.logicPath : this._name)
			: RouterPathProvider.getPathname(await this.getPathnameData(item)).value;
	}

	async getPathnameData(item?: Item): Promise<PathnameData> {
		const itemLogicPath = item
			? RouterPathProvider.parseItemLogicPath(new Path(item.logicPath)).fullPath
			: undefined;
		if (!this.repo.storage) return { catalogName: this.getName(), itemLogicPath };

		// TEMP:

		// const sourceType = await this.repo.storage.getType();

		// const group =
		// 	isGitSourceType(sourceType) // что делать с enterprise?
		// 		? await (this.repo.storage as GitStorage).getGroup()
		// 		: undefined;
		const group = await (this.repo.storage as GitStorage).getGroup();

		let branch: string;
		try {
			branch = await this.repo.gvc.getCurrentBranchName();
		} catch (e) {
			console.error(e);
		}
		return {
			sourceName: await this.repo.storage.getSourceName(),
			group,
			repName: await this.repo.storage.getName(),
			branch,
			catalogName: this.getName(),
			itemLogicPath,
		};
	}

	getName() {
		return this._name;
	}

	getBasePath(): Path {
		return this._basePath;
	}

	getRootCategoryRef(): ItemRef {
		return this._rootCaterogyRef;
	}

	getRootCategoryPath(): Path {
		return this._rootCaterogyPath;
	}

	get props() {
		return this._props;
	}

	get errors() {
		return this._errors;
	}

	get perms(): IPermission {
		return this._perms;
	}

	async load(): Promise<Catalog> {
		const catalogEntry = await this._load(this);
		await this._onLoad?.(catalogEntry);
		this._isLoad = true;
		return catalogEntry;
	}
}
