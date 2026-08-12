import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { ArticleFilter, Catalog, ItemFilter } from "@core/FileStructue/Catalog/Catalog";
import type { Category } from "@core/FileStructue/Category/Category";
import type { Item } from "@core/FileStructue/Item/Item";
import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import { ItemType } from "@core/FileStructue/Item/ItemType";

export class CatalogItemSearcher {
	private readonly _weak: WeakRef<Catalog>;
	private readonly _cachedItemPath = new Map<string, WeakRef<Item>>();
	private readonly _cachedLogicPath = new Map<string, WeakRef<Item>>();

	private _cacheHit = 0;
	private _cacheMiss = 0;

	constructor(catalog: Catalog) {
		this._weak = new WeakRef(catalog);
	}

	get cacheHit() {
		return this._cacheHit / (this._cacheHit + this._cacheMiss);
	}

	resetCache(paths?: string[]) {
		if (!paths) {
			this._cachedItemPath.clear();
			this._cachedLogicPath.clear();
			this._cacheHit = 0;
			this._cacheMiss = 0;
			return;
		}

		for (const path of paths) {
			const item = this._cachedItemPath.get(path)?.deref();
			if (item) this._cachedLogicPath.delete(item.logicPath);
			this._cachedItemPath.delete(path);
		}
	}

	findItemByPath(path: Path | ItemRef, type?: ItemType): Item {
		const resolvedPath = path instanceof Path ? path : path?.path;
		if (!resolvedPath) return null;

		const filter = [(i: Item) => (type ? i.type === type : true) && i.ref.path.compare(resolvedPath)];

		const cached = this._cachedItemPath.get(resolvedPath.value)?.deref();
		if (cached && this._assertFilters(cached as Article, filter)) {
			this._cacheHit++;
			return cached;
		}

		this._cacheMiss++;

		const item = this._findItem(
			this.catalog.getRootCategory(),
			[],
			[(i) => (type ? i.type === type : true) && i.ref.path.compare(resolvedPath)],
		);

		if (item) this._cachedItemPath.set(resolvedPath.value, new WeakRef(item));
		return item;
	}

	findItemByLogicPath(root: Category, logicPath: string, filters: ArticleFilter[] = []): Item {
		const cached = this._cachedLogicPath.get(logicPath)?.deref();
		if (cached && this._assertFilters(cached as Article, filters)) {
			this._cacheHit++;
			return cached;
		}

		this._cacheMiss++;

		const item = this._findItemByLogicPath(root, logicPath, filters);
		if (!item) return null;

		if (item.type === ItemType.category && (item as Category).parent) {
			this._cachedLogicPath.set(item.logicPath, new WeakRef(item));
			return item as Article;
		}

		if (item.type === ItemType.article) {
			this._cachedLogicPath.set(item.logicPath, new WeakRef(item));
			return item as Article;
		}

		return this._findItem(item as Category, filters, [(a) => !!a.parent]) as Article;
	}

	private get catalog(): Catalog {
		return this._weak.deref();
	}

	private _findItem(root: Category, parentFilters: ArticleFilter[] = [], itemFilters: ArticleFilter[] = []): Item {
		if (this._assertFilters(root, [...parentFilters, ...itemFilters])) return root;

		for (const item of root.items) {
			if (item.type !== ItemType.category) {
				if (this._assertFilters(item as Article, [...parentFilters, ...itemFilters])) return item;
			} else {
				if (this._assertFilters(item as Category, parentFilters)) {
					const article = this._findItem(item as Category, parentFilters, itemFilters) as Article;
					if (article) return article;
				}
			}
		}
		return null;
	}

	private _findItemByLogicPath(category: Category, logicPath: string, filters: ArticleFilter[]): Item {
		if (!this._assertFilters(category, filters)) {
			if (logicPath === category.logicPath || logicPath.startsWith(category.logicPath))
				return this._findErrorArticle(category, filters);
			return null;
		}

		if (logicPath === category.logicPath) {
			return category;
		}

		for (const item of category.items) {
			if (item.type === ItemType.category) {
				const article = this._findItemByLogicPath(item as Category, logicPath, filters) as Article;
				if (article) return article;
			} else {
				if (this._assertFilters(item as Article, filters) && logicPath === item.logicPath) return item;
				if (logicPath === item.logicPath) {
					return this._findErrorArticle(item as Article, filters);
				}
			}
		}
		return null;
	}

	private _findErrorArticle(article: Article, filters: ArticleFilter[]) {
		const filter = filters.find(
			(f): f is ItemFilter => !f(article, this.catalog) && !!(f as ItemFilter).getErrorArticle,
		);
		if (filter) return filter.getErrorArticle(article.logicPath);
	}

	private _assertFilters(article: Article, filters: ArticleFilter[]) {
		return !filters || filters.every((f) => f(article, this.catalog));
	}
}
