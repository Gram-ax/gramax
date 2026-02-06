import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure from "@core/FileStructue/FileStructure";
import SitePresenter, { ArticlePageData, ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import assert from "assert";

export default class ScopedPageData {
	constructor(
		private _fs: FileStructure,
		private _sp: SitePresenter,
	) {}

	async getArticlePageData(catalog: Catalog, articlePath: string, scope: TreeReadScope): Promise<ArticlePageData> {
		const commitScope = await convertScopeToCommitScope(scope, catalog.repo.gvc);
		const scopedCatalog = await catalog.repo.scopedCatalogs.getScopedCatalog(
			catalog.basePath,
			this._fs,
			commitScope,
		);

		const articleScopedPath = GitTreeFileProvider.scoped(new Path(articlePath), commitScope);
		const scopedArticle = scopedCatalog.findItemByItemPath<Article>(articleScopedPath);
		assert(scopedArticle);

		return this._sp.getArticlePageData(scopedArticle, scopedCatalog);
	}

	async getCatalogPageData(catalog: Catalog, scope: TreeReadScope): Promise<ClientCatalogProps> {
		const commitScope = await convertScopeToCommitScope(scope, catalog.repo.gvc);
		const scopedCatalog = await catalog.repo.scopedCatalogs.getScopedCatalog(
			catalog.basePath,
			this._fs,
			commitScope,
		);

		return this._sp.serializeCatalogProps(scopedCatalog);
	}
}
