import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import { XxHash } from "@core/Hash/Hasher";
import Cache from "@ext/cache/Cache";
import type CommentProvider from "@ext/markdown/elements/comment/edit/logic/CommentProvider";
import type { CommentData, PushArticleCommentFn } from "@ext/markdown/elements/comment/edit/logic/CommentProvider";

type Author = string;
type CommentHash = string;
type ArticlePath = string;
type AuthoredComments = Map<CommentHash, Author>;

interface ArticleCache<T> {
	hash: number;
	comments: T;
}

type ArticleCacheData = ArticleCache<[string, string][]>;
type ArticleCacheEntry = ArticleCache<AuthoredComments>;

type CatalogCache = Map<ArticlePath, ArticleCacheEntry>;
type CacheData = Record<string, ArticleCacheData>;

class CommentsCountCache {
	private static _COMMENTS_CACHE_KEY = "comments-count.json";

	private _cache: Cache;
	private _load: Promise<void>;
	private _commentsCache: CatalogCache = new Map();

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

	async getCommentsCache() {
		await this._loadCaches();
		return this._commentsCache;
	}

	async updateArticle(articlePath: Path, allComments: CommentData, content: string) {
		const articleCache = new Map();

		if (Object.keys(allComments).length) {
			const commentsToSave: CommentData = {};
			for (const id of Object.keys(allComments)) {
				if (!this._commentProvider.isAssigned(id, articlePath)) continue;
				commentsToSave[id] = allComments[id];
			}

			Object.entries(commentsToSave).map(([id, comment]) => {
				articleCache.set(id, comment.parsedData.comment.user.mail);
			});
		}

		this._commentsCache.set(articlePath.value, {
			comments: articleCache,
			hash: await this._hashCommentContentByPath(articlePath, content),
		});

		await this._saveCaches();
	}

	async updateCatalog(newCommentCache: Record<ArticlePath, AuthoredComments>) {
		for (const [articlePath, authoredComments] of Object.entries(newCommentCache)) {
			const path = new Path(articlePath);
			const hash = await this._hashCommentContentByPath(path);

			this._commentsCache.set(articlePath, {
				comments: authoredComments,
				hash,
			});
		}
		await this._saveCaches();
	}

	private async _saveCaches() {
		const data: CacheData = {};
		for (const [k, set] of this._commentsCache.entries()) {
			const comments = Array.from(set.comments || []);
			if (set.hash === null) continue;

			data[k] = {
				comments,
				hash: set.hash,
			};
		}
		await this._cache.set(CommentsCountCache._COMMENTS_CACHE_KEY, JSON.stringify(data));
	}

	private _loadCaches() {
		if (!this._load) this._load = this._loadCachesFromDisk();
		return this._load;
	}

	private async _loadCachesFromDisk() {
		try {
			if (!(await this._cache.exists(CommentsCountCache._COMMENTS_CACHE_KEY))) return;

			const raw = await this._cache.get(CommentsCountCache._COMMENTS_CACHE_KEY);
			const parsed = JSON.parse(raw || "{}") as CacheData;

			for (const [k, data] of Object.entries(parsed)) {
				const comments = new Map<Author, CommentHash>(data.comments);
				this._commentsCache.set(k, {
					comments,
					hash: data.hash,
				});
			}

			await this._validateCache();
		} catch (e) {
			console.error("Error loading catalog comments cache:", e);
		}
	}

	private async _validateCache() {
		const commentsCache = [...this._commentsCache];
		let needSave = false;

		commentsCache.forEachAsync(async ([articlePath, cache]) => {
			const path = new Path(articlePath);
			const currentHash = await this._hashCommentContentByPath(path);

			if (currentHash !== cache.hash) {
				this._commentsCache.delete(articlePath);
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
		this._commentsCache.clear();
		this._load = null;
	}

	private _clearCommentCounts(articlePath: string) {
		this._commentsCache.delete(articlePath);
	}

	private async _onItemPathChanged(from: Path, to: Path) {
		if (from.compare(to)) return;
		await this._loadCaches();
		if (!this._commentsCache.has(from.value)) return;

		this._clearCommentCounts(from.value);
		await this._saveCaches();
	}

	private async _parseArticleForComments(article: Article) {
		const articlePath = article.ref.path;
		const newCommentCache: Map<string, string> = new Map();

		const pushArticleComment: PushArticleCommentFn = (mail, id) => {
			newCommentCache.set(id, mail);
		};

		await article.parsedContent.read((p) => {
			this._commentProvider.countCommentsRecursively(p.editTree, articlePath, pushArticleComment);
		});

		const comments = newCommentCache.size ? await this._commentProvider.getComments(articlePath) : {};
		await this.updateArticle(articlePath, comments, await article.getContent());
	}

	private _initArticleEvents(article: Article) {
		article.events.on("item-update-content", async (props) => {
			await this._loadCaches();
			const item = props.item as Article;

			this._clearCommentCounts(item.ref.path.value);
			if (await item.parsedContent.isNull()) return;

			await this._parseArticleForComments(item);
		});
	}

	private _initCatalogEvents() {
		this._fs.events.on("before-item-create", ({ mutableItem }) => {
			const item = mutableItem.item as Article;
			this._initArticleEvents(item);
		});

		this._catalog.events.on("item-deleted", async ({ ref }) => {
			await this._loadCaches();
			this._clearCommentCounts(ref.path.value);
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

export default CommentsCountCache;
