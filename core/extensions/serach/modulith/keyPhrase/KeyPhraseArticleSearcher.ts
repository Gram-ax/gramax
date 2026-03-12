import type { Article } from "@core/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { NGramIndex } from "@ext/serach/modulith/keyPhrase/NGramIndex";

export interface KeyPhraseArticleSearcherItem {
	id: string;
	catalog: ReadonlyCatalog;
	article: Article;
}

export class KeyPhraseArticleSearcher {
	private readonly index = new NGramIndex<KeyPhraseArticleSearcherItem>(3);
	private readonly _idToCatalog = new Map<string, string>();
	private readonly _catalogIds = new Map<string, Set<string>>();

	updateArticle(item: KeyPhraseArticleSearcherItem): void {
		const catalogName = item.catalog.name;
		this._idToCatalog.set(item.id, catalogName);
		let ids = this._catalogIds.get(catalogName);
		if (ids === undefined) {
			ids = new Set();
			this._catalogIds.set(catalogName, ids);
		}
		ids.add(item.id);
		this.index.setTexts(item, item?.article?.props?.searchPhrases ?? []);
	}

	removeArticle(id: string): void {
		this.index.removeById(id);
		const catalogName = this._idToCatalog.get(id);
		if (catalogName !== undefined) {
			this._catalogIds.get(catalogName)?.delete(id);
			this._idToCatalog.delete(id);
		}
	}

	removeCatalog(catalogName: string): void {
		const ids = this._catalogIds.get(catalogName);
		if (ids === undefined) return;
		for (const id of ids) {
			this.index.removeById(id);
			this._idToCatalog.delete(id);
		}
		this._catalogIds.delete(catalogName);
	}

	removeArticlesNotIn(catalogName: string, keepIds: Set<string>): void {
		const ids = this._catalogIds.get(catalogName);
		if (ids === undefined) return;
		for (const id of [...ids]) {
			if (!keepIds.has(id)) {
				this.removeArticle(id);
			}
		}
	}

	search(query: string): KeyPhraseArticleSearcherItem[] {
		return this.index.search(query);
	}
}
