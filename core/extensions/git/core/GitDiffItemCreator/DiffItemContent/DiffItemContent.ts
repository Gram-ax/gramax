import FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import { CommitScope, TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import Repository from "@ext/git/core/Repository/Repository";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { JSONContent } from "@tiptap/core";
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

	constructor(private _workdirCatalog: Catalog, private _fs: FileStructure) {
		this._repo = this._workdirCatalog.repo;
		this._fp = this._fs.fp;
	}

	async getContent(
		scope: DiffItemContentScope,
		filePath: Path,
		articleParser: ArticleParser,
		isResource: boolean,
	): Promise<DiffItemContentData> {
		const content = await this._getCachedContent(scope, filePath);
		const editTree = isResource ? null : await this._getEditTree(scope, filePath, articleParser);

		return { content, editTree };
	}

	private async _getCatalog(scope: DiffItemContentScope) {
		if (scope === "workdir") {
			assert(this._workdirCatalog, "Workdir catalog is missing");
			return this._workdirCatalog;
		}
		return this._repo.scopedCatalogs.getScopedCatalog(this._workdirCatalog.basePath, this._fs, scope);
	}

	private async _getCachedContent(scope: DiffItemContentScope, filePath: Path): Promise<string> {
		if (scope === "workdir") return this._getContent(scope, filePath);

		const commitScope = await convertScopeToCommitScope(scope, this._repo.gvc);
		const key = this._getCacheKey(commitScope, filePath);

		if (!this._contentCache.has(key)) {
			const content = await this._getContent(commitScope, filePath);
			this._contentCache.set(key, content);
		}

		return this._contentCache.get(key);
	}

	private async _getContent(scope: CommitOrWorkdir, filePath: Path) {
		if (scope === "workdir") {
			const itemRefPath = this._workdirCatalog.getItemRefPath(filePath);
			try {
				return await this._fp.read(itemRefPath);
			} catch {
				return "";
			}
		}

		return this._repo.gvc.showFileContent(filePath, new GitVersion(scope.commit));
	}

	private async _getEditTree(
		scope: DiffItemContentScope,
		filePath: Path,
		articleParser: ArticleParser,
	): Promise<JSONContent> {
		const catalog = await this._getCatalog(scope);

		const itemRefPath = catalog.getItemRefPath(filePath);
		const itemRef = this._fp.getItemRef(itemRefPath);

		const article = catalog.findItemByItemRef<Article>(itemRef);
		if (!article) return null;

		if (await article.parsedContent.isNull()) {
			try {
				await articleParser.parse(article, catalog);
			} catch {
				return null;
			}
		}
		const editTree = { ...(await article.parsedContent.read((p) => p?.editTree)) };
		return getArticleWithTitle(article.props.title, editTree);
	}

	private _getCacheKey(scope: CommitScope, filePath: Path) {
		return `${scope.commit}:${filePath.value}`;
	}
}
