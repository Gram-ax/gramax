import Path from "@core/FileProvider/Path/Path";
import BaseCatalog, { type BaseCatalogInitProps, type CatalogOnLoad } from "@core/FileStructue/Catalog/BaseCatalog";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import FileStructure, { type FSLazyLoadCatalog } from "@core/FileStructue/FileStructure";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type { MakeResourceUpdater } from "@core/Resource/ResourceUpdaterFactory";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps";
import type Repository from "@ext/git/core/Repository/Repository";
import Permission from "@ext/security/logic/Permission/Permission";

import assert from "assert";

export type CatalogEntryInitProps<P extends CatalogProps = CatalogProps> = BaseCatalogInitProps & {
	name: string;
	rootCaterogyRef: ItemRef;
	basePath: Path;
	props: P;
	load: FSLazyLoadCatalog;
	isReadOnly: boolean;
	fs: FileStructure;
};

export default class CatalogEntry<P extends CatalogProps = CatalogProps> extends BaseCatalog<P> {
	protected readonly _type = "entry";

	private _onCatalogLoadCallback: CatalogOnLoad<Catalog<P>>;
	private _loadFn: FSLazyLoadCatalog;
	private _perms: Permission;
	private _props: P;
	private _fs: FileStructure;

	constructor(init: CatalogEntryInitProps<P>) {
		super(init);
		this._loadFn = init.load;
		this._perms = new Permission(init.props.private);
		this._props = init.props;
		this._fs = init.fs;
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

	async updateProps(props: CatalogEditProps | CatalogProps, makeResourceUpdater: MakeResourceUpdater) {
		super.updateProps(props, makeResourceUpdater);
		await this._fs.saveCatalog(this);

		assert(!props.docroot, "CatalogEntry can not update it's own docroot path. This is a bug");
		assert(!(props.url && props.url !== this.name), "CatalogEntry can not update it's own name. This is a bug");
	}

	async load(): Promise<Catalog> {
		const catalog = (await this._loadFn(this as any)) as any;
		await this._onCatalogLoadCallback?.(catalog);
		return catalog;
	}
}
