import Path from "@core/FileProvider/Path/Path";
import { Catalog, CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import { FSLazyLoadCatalog, FSProps } from "@core/FileStructue/FileStructure";
import { ItemRef } from "@core/FileStructue/Item/Item";
import IPermission from "@ext/security/logic/Permission/IPermission";
import Permission from "@ext/security/logic/Permission/Permission";

type CatalogOnLoad = (catalog: Catalog) => void | Promise<void>;

type CatalogEntryProps = {
	name: string;
	rootCaterogyRef: ItemRef;
	rootCaterogyPath: Path;
	basePath: Path;
	props: FSProps;
	errors: CatalogErrors;
	load: FSLazyLoadCatalog;
};

export default class CatalogEntry {
	protected _onLoad?: CatalogOnLoad;
	protected _perms: IPermission;
	protected _isLoad = false;
	protected _name: string;
	private _rootCaterogyRef: ItemRef;
	private _rootCaterogyPath: Path;
	protected _basePath: Path;
	protected _props: FSProps;
	protected _errors: CatalogErrors;
	protected _load: FSLazyLoadCatalog;

	constructor(init: CatalogEntryProps) {
		(this._name = init.name), (this._rootCaterogyRef = init.rootCaterogyRef);
		this._rootCaterogyPath = init.rootCaterogyPath;
		this._basePath = init.basePath;
		this._props = init.props;
		this._errors = init.errors;
		this._load = init.load;
		this._perms = new Permission(this._props["private"]);
	}

	withOnLoad(callback: CatalogOnLoad): void {
		this._onLoad = callback;
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
