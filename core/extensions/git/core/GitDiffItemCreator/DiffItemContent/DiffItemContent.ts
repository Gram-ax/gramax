import type FileProvider from "@core/FileProvider/model/FileProvider";
import type Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type FileStructure from "@core/FileStructue/FileStructure";
import type { CommitScope, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import type Repository from "@ext/git/core/Repository/Repository";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import { span } from "@ext/loggers/opentelemetry";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import type { JSONContent } from "@tiptap/core";
import assert from "assert";

export interface DiffItemContentData {
	content: string;
	editTree: JSONContent;
}

export type DiffItemContentScope = TreeReadScope | "workdir";
type CommitOrWorkdir = CommitScope | "workdir";

export default class DiffItemContent {
	private _repo: Repository;
	private _fp: FileProvider;
	private _contentCache: Map<string, string> = new Map();

	constructor(
		private _workdirCatalog: Catalog,
		private _fs: FileStructure,
	) {
		this._repo = this._workdirCatalog.repo;
		this._fp = this._fs.fp;
		this._handleRepoEvents();
	}

	async getContent(
		scope: DiffItemContentScope,
		filePath: Path,
		articleParser: ArticleParser,
		isResource: boolean,
	): Promise<DiffItemContentData> {
		const resolvedScope = scope === "workdir" ? scope : await convertScopeToCommitScope(scope, this._repo.gvc);

		const content = await this._getCachedContent(resolvedScope, filePath);
		const editTree = isResource ? null : await this._getEditTree(resolvedScope, filePath, articleParser);

		return { content, editTree };
	}

	private async _getCatalog(scope: CommitOrWorkdir) {
		if (scope === "workdir") {
			assert(this._workdirCatalog, "Workdir catalog is missing");
			return this._workdirCatalog;
		}

		const catalog = await this._repo.scopedCatalogs.getScopedCatalog(
			this._workdirCatalog.basePath,
			this._fs,
			scope,
		);
		return catalog;
	}

	private async _getCachedContent(scope: CommitOrWorkdir, filePath: Path): Promise<string> {
		if (scope === "workdir") return this._getContent(scope, filePath);

		const key = this._getCacheKey(scope, filePath);
		const cacheHit = this._contentCache.has(key);

		if (!cacheHit) {
			const content = await this._getContent(scope, filePath);
			this._contentCache.set(key, content);
		}

		return this._contentCache.get(key);
	}

	private async _getContent(scope: CommitOrWorkdir, filePath: Path) {
		if (scope === "workdir") {
			const itemRefPath = this._workdirCatalog.getItemRefPath(filePath);
			try {
				return await this._fp.read(itemRefPath);
			} catch (error) {
				span()?.addEvent("workdir-read-failed", {
					path: filePath.value,
					error: error instanceof Error ? error.message : String(error),
				});
				return "";
			}
		}

		return this._repo.gvc.showFileContent(filePath, new GitVersion(scope.commit));
	}

	private async _getEditTree(
		scope: CommitOrWorkdir,
		filePath: Path,
		articleParser: ArticleParser,
	): Promise<JSONContent> {
		const catalog = await this._getCatalog(scope);

		const itemRefPath = catalog.getItemRefPath(filePath);
		const itemRef = this._fp.getItemRef(itemRefPath);

		const scopeName = this._getScopeName(scope);

		const article = catalog.findItemByItemPath<Article>(itemRef.path);
		if (!article) {
			span()?.addEvent("article-not-in-catalog", {
				scope: scopeName,
				path: filePath.value,
				itemRefPath: itemRef.path.value,
				catalogBasePath: catalog.basePath.value,
			});
			return null;
		}

		const shouldParse = await article.parsedContent.isNull();
		if (shouldParse) {
			try {
				await articleParser.parse(article, catalog);
			} catch (error) {
				span()?.addEvent("parse-failed", {
					scope: scopeName,
					path: filePath.value,
					error: error instanceof Error ? error.message : String(error),
				});
				return null;
			}
		}
		const parsedEditTree = await article.parsedContent.read((p) => p?.editTree);
		if (!parsedEditTree) span()?.addEvent("empty-edit-tree", { scope: scopeName, path: filePath.value });

		const editTree = { ...parsedEditTree };
		return getArticleWithTitle(article.props.title, editTree);
	}

	private _getCacheKey(scope: CommitScope, filePath: Path) {
		return `${scope.commit}:${filePath.value}`;
	}

	private _handleRepoEvents() {
		this._repo.events.on("publish", () => this._contentCache.clear());
		this._repo.events.on("checkout", () => this._contentCache.clear());
		this._repo.events.on("merge", () => this._contentCache.clear());
		this._repo.events.on("sync", () => this._contentCache.clear());
	}

	private _getScopeName(scope: DiffItemContentScope): string {
		if (typeof scope === "string") return scope;
		if ("commit" in scope) return scope.commit;
		if ("reference" in scope) return scope.reference;
		return `${scope.oldCommit.commit}..${scope.newCommit.commit}`;
	}
}
