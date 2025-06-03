export default abstract class CatalogToIndex {
	private static readonly _localStorageKey = "migrationCatalogToIndex";

	static hasInit(): boolean {
		return localStorage.getItem(this._localStorageKey) !== null;
	}

	static getCatalogToIndex(): string[] {
		const catalogToIndex = localStorage.getItem(this._localStorageKey);
		if (!catalogToIndex) return [];
		return JSON.parse(catalogToIndex);
	}

	static setCatalogToIndex(catalogToIndex: string[]): void {
		localStorage.setItem(this._localStorageKey, JSON.stringify(catalogToIndex));
	}

	static addCatalogToIndex(catalogName: string): void {
		const catalogToIndex = this.getCatalogToIndex();
		catalogToIndex.push(catalogName);
		this.setCatalogToIndex(catalogToIndex);
	}

	static removeCatalogFromIndex(catalogName: string): void {
		const catalogToIndex = this.getCatalogToIndex();
		const index = catalogToIndex.indexOf(catalogName);
		if (index !== -1) {
			catalogToIndex.splice(index, 1);
			this.setCatalogToIndex(catalogToIndex);
		}
	}
}
