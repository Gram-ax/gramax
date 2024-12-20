import Path from "@core/FileProvider/Path/Path";
import BaseCatalog, { type BaseCatalogInitProps, type CatalogOnLoad } from "@core/FileStructue/Catalog/BaseCatalog";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { FSLazyLoadCatalog } from "@core/FileStructue/FileStructure";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type Repository from "@ext/git/core/Repository/Repository";
import Permission from "@ext/security/logic/Permission/Permission";

export type CatalogEntryInitProps<P extends CatalogProps = CatalogProps> = BaseCatalogInitProps & {
	name: string;
	rootCaterogyRef: ItemRef;
	basePath: Path;
	props: P;
	load: FSLazyLoadCatalog;
	isReadOnly: boolean;
};

export default class CatalogEntry<P extends CatalogProps = CatalogProps> extends BaseCatalog<P> {
	protected readonly _type = "entry";

	private _onCatalogLoadCallback: CatalogOnLoad<Catalog<P>>;
	private _loadFn: FSLazyLoadCatalog;
	private _perms: Permission;
	private _props: P;

	constructor(init: CatalogEntryInitProps<P>) {
		super(init);
		this._loadFn = init.load;
		this._perms = new Permission(init.props.private);
		this._props = init.props;
	}

	get props(): P {
		return this._props;
	}

	get perms(): Permission {
		return this._perms;
	}

	setRepository(repo: Repository): void {
		super.repo = repo;
	}

	getRootCategoryDirectoryPath(): Path {
		return this.getRootCategoryRef().path.parentDirectoryPath;
	}

	setLoadCallback(callback: CatalogOnLoad<Catalog<P>>): void {
		this._onCatalogLoadCallback = callback;
	}

	async load(): Promise<Catalog> {
		const catalog = (await this._loadFn(this as any)) as any;
		await this._onCatalogLoadCallback?.(catalog);
		return catalog;
	}
}
