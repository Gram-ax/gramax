import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type CatalogEntry from "@core/FileStructue/Catalog/CatalogEntry";

export default class CatalogVersionCollection {
	private _versions: Map<string, CatalogEntry> = new Map();

	constructor(private _default: Catalog) {}

	add(refname: string, entry: CatalogEntry): void {
		this._versions.set(refname, entry);
	}

	default(): Catalog {
		return this._default;
	}

	async get(refname?: string): Promise<Catalog> {
		if (!this._default) throw new Error("Main catalog not set");
		if (!refname) return this._default;

		const entry = this._versions.get(refname);
		if (!entry) throw new Error(`Version of catalog ${this._default.getName()} with refname ${refname} not found`);
		return await entry.load();
	}
}
