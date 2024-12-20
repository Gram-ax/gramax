import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";
import type { CatalogProps } from "@core/FileStructue/Catalog/CatalogProps";
import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Item, ItemProps } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type PathnameData from "@core/RouterPath/model/PathnameData";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import type GitStorage from "@ext/git/core/GitStorage/GitStorage";
import type Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type Permission from "@ext/security/logic/Permission/Permission";

export type CatalogOnLoad<C extends BaseCatalog> = (catalog: C) => Promise<void> | void;

export type BaseCatalogInitProps = {
	name: string;
	basePath: Path;
	isReadOnly: boolean;
	rootCaterogyRef: ItemRef;
};

export type CatalogType = "catalog" | "entry";

export default abstract class BaseCatalog<P extends CatalogProps = CatalogProps, I extends ItemProps = ItemProps>
	implements ReadonlyBaseCatalog<P, I>
{
	protected abstract readonly _type: CatalogType;

	private _name: string;
	private _basePath: Path;
	private _isReadOnly: boolean;
	private _rootCategoryRef: ItemRef;
	private _repo: Repository;

	constructor(init: BaseCatalogInitProps) {
		this._name = init.name;
		this._basePath = init.basePath;
		this._isReadOnly = init.isReadOnly;
		this._rootCategoryRef = init.rootCaterogyRef;
	}

	get deref() {
		return this;
	}

	get name() {
		return this._name;
	}

	protected set name(name: string) {
		this._name = name;
	}

	get basePath() {
		return this._basePath;
	}

	protected set basePath(basePath: Path) {
		this._basePath = basePath;
	}

	get isReadOnly() {
		return this._isReadOnly;
	}

	protected set repo(repo: Repository) {
		this._repo = repo;
	}

	get repo(): Repository {
		return this._repo ?? RepositoryProvider.null();
	}

	getRootCategoryRef(): ItemRef {
		return this._rootCategoryRef;
	}

	getRelativeRootCategoryPath(): Path {
		const root = this._rootCategoryRef.path.parentDirectoryPath;
		return root.subDirectory(this._rootCategoryRef.path).parentDirectoryPath;
	}

	async getPathname(item?: Item<I>): Promise<string> {
		return this._isReadOnly
			? Promise.resolve(item ? item.logicPath : this._name)
			: RouterPathProvider.getPathname(await this.getPathnameData(item)).value;
	}

	async getPathnameData(item?: Item<I>): Promise<PathnameData> {
		const itemLogicPath = item
			? RouterPathProvider.parseItemLogicPath(new Path(item.logicPath)).fullPath
			: undefined;

		if (!this.repo.storage) return { catalogName: this.name, itemLogicPath };

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
			repo: await this.repo.storage.getName(),
			refname: branch,
			catalogName: this.name,
			itemLogicPath,
		};
	}

	upgrade<T extends CatalogType, L extends boolean = false>(to: T, load?: L) {
		type R = (T extends "entry" ? CatalogEntry<P> : Catalog<P>) | null;

		if (to === "entry" && this._type === "entry") return this as unknown as R;
		if (to === "catalog" && this._type === "catalog") return this as unknown as R;
		if (load && to === "catalog" && this._type === "entry")
			return (this as unknown as CatalogEntry<P>).load() as L extends true ? Promise<R> : never;

		return null;
	}

	abstract get perms(): Permission;

	abstract get props(): P;

	abstract setRepository(repo: Repository): void;
	abstract getRootCategoryDirectoryPath(): Path;
}
