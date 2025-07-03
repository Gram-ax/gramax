import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import parseContent from "@core/FileStructue/Article/parseContent";
import ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import ArticleProvider, { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
import convertScopeToCommitScope from "@ext/git/core/ScopedCatalogs/convertScopeToCommitScope";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import assert from "assert";
import { Article } from "../../../../core/logic/FileStructue/Article/Article";

const get: Command<
	{
		src: Path;
		ctx: Context;
		articlePath: Path;
		catalogName: string;
		mimeType: MimeTypes;
		ifNotExistsErrorText: { title: string; message: string };
		providerType: ArticleProviderType;
	},
	{ mime: MimeTypes; hashItem: HashResourceManager }
> = Command.create({
	path: "article/resource/get",

	kind: ResponseKind.blob,

	async do({ src, mimeType, catalogName, articlePath, ifNotExistsErrorText, ctx, providerType }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();
		const fs = workspace.getFileStructure();

		const mime = mimeType ?? MimeTypes?.[src.extension] ?? `application/${src.extension}`;
		let catalog: ReadonlyCatalog;
		const { unscoped, scope } = GitTreeFileProvider.unscope(new Path(catalogName));

		if (scope) {
			catalog = await workspace.getCatalog(unscoped.value, ctx);
			assert(catalog);
			assert(catalog.repo.gvc);
			catalog = await catalog.repo.scopedCatalogs.getScopedCatalog(catalog.basePath, fs, scope);
			if (!catalog) return;
			// temp
			// TODO: add scoped CatalogProps, ArticleProps, ApiUrlCreator on front using ScopedCatalogs props
			const commitScope = await convertScopeToCommitScope(scope, catalog.repo.gvc);
			articlePath = GitTreeFileProvider.scoped(articlePath, commitScope);
		} else {
			catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
		}

		const article = providerType
			? ArticleProvider.getProvider(catalog as ContextualCatalog, providerType).getArticle(articlePath.value)
			: catalog.findItemByItemPath<Article>(articlePath);

		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		ifNotExistsErrorText &&
			(await article.parsedContent.read((p) => p.resourceManager.assertExists(src, ifNotExistsErrorText)));

		const hashItem = await article.parsedContent.read((p) => {
			return new HashResourceManager(src, p.resourceManager);
		});

		return { hashItem, mime };
	},

	params(ctx, q, body) {
		const src = new Path(q.src);
		const mimeType = q.mimeType as MimeTypes;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const providerType = q.providerType as ArticleProviderType;
		return { ctx, src, mimeType, catalogName, articlePath, ifNotExistsErrorText: body, providerType };
	},
});

export default get;
