import { Catalog, CatalogErrors } from "@core/FileStructue/Catalog/Catalog";
import { FSLazyLoadCatalog, FSProps } from "@core/FileStructue/FileStructure";
import { ItemRef } from "@core/FileStructue/Item/Item";
import IPermission from "@ext/security/logic/Permission/IPermission";
import Permission from "@ext/security/logic/Permission/Permission";

export type CatalogOnLoad = (catalog: Catalog) => void | Promise<void>;

export default class CatalogEntry {
	private _inner?: Catalog;
	private _onLoad?: CatalogOnLoad;
	private _perms: IPermission;

	constructor(
		private _name: string,
		private _ref: ItemRef,
		private _props: FSProps,
		private _errors: CatalogErrors,
		private _load: FSLazyLoadCatalog,
	) {
		this._perms = new Permission(_props["private"]);
	}

	withOnLoad(callback: CatalogOnLoad): void {
		this._onLoad = callback;
	}

	get name() {
		return this._name;
	}

	get ref() {
		return this._ref;
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

	async catalog() {
		if (!this._inner) {
			this._inner = await this._load(this);
			await this._onLoad?.(this._inner);
		}
		return this._inner;
	}
}
