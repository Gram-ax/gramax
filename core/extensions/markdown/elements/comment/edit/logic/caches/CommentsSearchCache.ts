import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import { XxHash } from "@core/Hash/Hasher";
import type { CommentBlock } from "@core-ui/CommentBlock";
import Cache from "@ext/cache/Cache";
import type CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";

interface SearchableAnswer {
	content: string;
}

interface SearchableComment {
	content: string;
	answers: SearchableAnswer[];
}

interface ArticleCache<T> {
	hash: number;
	comments: T;
}

type SearchableComments = Map<string, SearchableComment>;

type ArticleCacheEntry = ArticleCache<SearchableComments>;

type CatalogCache = Map<string, ArticleCacheEntry>;

interface SerializedAnswer {
	content: string;
}

interface SerializedComment {
	content: string;
	answers: SerializedAnswer[];
}

interface ArticleCacheData {
	hash: number;
	comments: [string, SerializedComment][];
}

type CacheData = Record<string, ArticleCacheData>;

export class CommentsSearchCache {
	private static _CACHE_KEY = "comments-search.json";

	private _cache: Cache;
	private _load: Promise<void>;
	private _searchCache: CatalogCache = new Map();

	constructor(
		private _fp: FileProvider,
		private _fs: FileStructure,
		private _catalog: Catalog,
		private _commentProvider: CommentProvider,
	) {
		this._initCatalogEvents();
		const cacheDirPath = Cache.getCacheDirPath(_catalog.name);
		this._cache = new Cache(this._fp, cacheDirPath.value);
	}

	async getSearchCache() {
		await this._loadCaches();
		return this._searchCache;
	}

	async updateArticle(articlePath: Path, rawComments: Record<string, CommentBlock<string>>, fileContent: string) {
		const articleComments: SearchableComments = new Map();

		for (const [id, block] of Object.entries(rawComments)) {
			if (!this._commentProvider.isAssigned(id, articlePath)) continue;

			const commentContent = typeof block.comment?.content === "string" ? block.comment.content : "";

			const answers: SearchableAnswer[] = (block.answers ?? []).map((a) => ({
				content: typeof a.content === "string" ? a.content : "",
			}));

			articleComments.set(id, { content: commentContent, answers });
		}

		this._searchCache.set(articlePath.value, {
			comments: articleComments,
			hash: await this._hashCommentContentByPath(articlePath, fileContent),
		});

		await this._saveCaches();
	}

	async updateCatalogFromFiles(
		articleIds: Record<string, Map<string, string>>,
		readComments: (path: Path) => Promise<Record<string, CommentBlock>>,
	) {
		const searchCache: Record<string, SearchableComments> = {};
		for (const [articlePath, ids] of Object.entries(articleIds)) {
			const path = new Path(articlePath);
			const rawComments = await readComments(path);
			const searchableComments: SearchableComments = new Map();

			for (const id of ids.keys()) {
				const block = rawComments[id];
				if (!block?.comment) continue;
				const content = typeof block.comment.content === "string" ? block.comment.content : "";
				const answers = (block.answers ?? []).map((a) => ({
					content: typeof a.content === "string" ? a.content : "",
				}));
				searchableComments.set(id, { content, answers });
			}

			searchCache[articlePath] = searchableComments;
		}
		await this.updateCatalog(searchCache);
	}

	async updateCatalog(newSearchCache: Record<string, SearchableComments>) {
		for (const [articlePath, searchableComments] of Object.entries(newSearchCache)) {
			const path = new Path(articlePath);
			const hash = await this._hashCommentContentByPath(path);

			this._searchCache.set(articlePath, {
				comments: searchableComments,
				hash,
			});
		}

		await this._saveCaches();
	}

	private async _saveCaches() {
		const data: CacheData = {};

		for (const [k, entry] of this._searchCache.entries()) {
			if (entry.hash === null) continue;
			data[k] = {
				hash: entry.hash,
				comments: Array.from(entry.comments.entries()),
			};
		}

		await this._cache.set(CommentsSearchCache._CACHE_KEY, JSON.stringify(data));
	}

	private _loadCaches() {
		if (!this._load) this._load = this._loadCachesFromDisk();
		return this._load;
	}

	private async _loadCachesFromDisk() {
		try {
			if (!(await this._cache.exists(CommentsSearchCache._CACHE_KEY))) return;

			const raw = await this._cache.get(CommentsSearchCache._CACHE_KEY);
			const parsed = JSON.parse(raw || "{}") as CacheData;

			for (const [k, data] of Object.entries(parsed)) {
				const comments: SearchableComments = new Map(data.comments);
				this._searchCache.set(k, { comments, hash: data.hash });
			}

			await this._validateCache();
		} catch (e) {
			console.error("Error loading comment search cache:", e);
		}
	}

	private async _validateCache() {
		const entries = [...this._searchCache];
		let needSave = false;

		entries.forEachAsync(async ([articlePath, cache]) => {
			const path = new Path(articlePath);
			const currentHash = await this._hashCommentContentByPath(path);

			if (currentHash !== cache.hash) {
				this._searchCache.delete(articlePath);
				needSave = true;
			}
		});
		if (needSave) await this._saveCaches();
	}

	private async _hashCommentContentByPath(path: Path, commentContent?: string): Promise<number> {
		const article = this._catalog.findItemByItemPath<Article>(path);

		if (!article) return null;
		const articleContent = await article.getContent();
		if (!articleContent) return 0;
		const commentFileExist = await this._fp.exists(this._commentProvider.getFilePath(article.ref.path));

		if (!commentFileExist) return 0;
		const data = commentContent || (await this._fp.read(this._commentProvider.getFilePath(article.ref.path)));

		const hasher = XxHash.xxhash.create32(0);
		hasher.update(articleContent);
		hasher.update(data);
		return hasher.digest();
	}

	private _clearCache() {
		this._searchCache.clear();
		this._load = null;
	}

	private _clearArticle(articlePath: string) {
		this._searchCache.delete(articlePath);
	}

	private async _onItemPathChanged(from: Path, to: Path) {
		if (from.compare(to)) return;
		await this._loadCaches();
		if (!this._searchCache.has(from.value)) return;

		this._clearArticle(from.value);
		await this._saveCaches();
	}

	private async _parseArticleForSearch(article: Article) {
		const articlePath = article.ref.path;
		const foundIds = new Set<string>();

		const pushArticleComment = (_mail: string, id: string) => {
			foundIds.add(id);
		};

		await article.parsedContent.read((p) => {
			this._commentProvider.countCommentsRecursively(p.editTree, articlePath, pushArticleComment);
		});

		const allComments = foundIds.size ? await this._commentProvider.getComments(articlePath) : {};
		const comments: Record<string, CommentBlock<string>> = {};
		for (const id of foundIds) {
			if (allComments[id]) comments[id] = allComments[id].stringifiedData as CommentBlock<string>;
		}

		await this.updateArticle(articlePath, comments, await article.getContent());
	}

	private _initArticleEvents(article: Article) {
		article.events.on("item-update-content", async (props) => {
			await this._loadCaches();
			const item = props.item as Article;

			this._clearArticle(item.ref.path.value);
			if (await item.parsedContent.isNull()) return;

			await this._parseArticleForSearch(item);
		});
	}

	private _initCatalogEvents() {
		this._fs.events.on("before-item-create", ({ mutableItem }) => {
			const item = mutableItem.item as Article;
			this._initArticleEvents(item);
		});

		this._catalog.events.on("item-deleted", async ({ ref }) => {
			await this._loadCaches();
			this._clearArticle(ref.path.value);
			await this._saveCaches();
		});

		this._catalog.events.on("item-moved", ({ from, to }) => this._onItemPathChanged(from.path, to.path));
		this._catalog.events.on("item-props-updated", ({ ref, item }) =>
			this._onItemPathChanged(ref.path, item.ref.path),
		);

		let checkoutToken = null;
		let syncToken = null;
		this._catalog.events.on("repository-set", ({ catalog }) => {
			if (checkoutToken) catalog.repo.events.off(checkoutToken);
			if (syncToken) catalog.repo.events.off(syncToken);
			checkoutToken = catalog.repo.events.on("checkout", () => this._clearCache());
			syncToken = catalog.repo.events.on("sync", () => this._clearCache());
		});
	}
}
