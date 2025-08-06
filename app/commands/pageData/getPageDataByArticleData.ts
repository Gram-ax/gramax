import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ScopedPageData from "@ext/git/core/ScopedCatalogs/ScopedPageData";
import assert from "assert";

const getPageDataByArticleData: Command<
	{ catalogName: string; ctx: Context; articlePath: string; scope?: TreeReadScope },
	ArticlePageData
> = Command.create({
	path: "page/getPageDataByArticleData",

	kind: ResponseKind.json,

	async do({ catalogName, ctx, scope, articlePath }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog);

		const fs = workspace.getFileStructure();
		const sp = this._app.sitePresenterFactory.fromContext(ctx);

		if (!scope) {
			const article = catalog.findItemByItemPath<Article>(new Path(articlePath));
			assert(article);

			return await sp.getArticlePageData(article, catalog);
		}

		assert(catalog.repo.gvc);
		const scopedPageData = new ScopedPageData(fs, sp);
		return await scopedPageData.getArticlePageData(catalog, articlePath, scope);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = q.articlePath;
		const scope = q.scope ? (JSON.parse(q.scope) as TreeReadScope) : undefined;
		return { ctx, catalogName, scope, articlePath };
	},
});

export default getPageDataByArticleData;
