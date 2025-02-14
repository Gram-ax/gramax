import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import parseContent from "@core/FileStructue/Article/parseContent";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import HashResourceManager from "@core/Hash/HashItems/HashResourceManager";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";
import { Article } from "../../../../core/logic/FileStructue/Article/Article";

const get: Command<
	{
		src: Path;
		ctx: Context;
		articlePath: Path;
		catalogName: string;
		mimeType: MimeTypes;
		ifNotExistsErrorText: { title: string; message: string };
	},
	{ mime: MimeTypes; hashItem: HashResourceManager }
> = Command.create({
	path: "article/resource/get",

	kind: ResponseKind.blob,

	async do({ src, mimeType, catalogName, articlePath, ifNotExistsErrorText, ctx }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();
		const fs = workspace.getFileStructure();

		const mime = mimeType ?? MimeTypes?.[src.extension] ?? `application/${src.extension}`;
		let catalog: ReadonlyCatalog;
		const { unscoped, scope } = GitTreeFileProvider.unscope(new Path(catalogName));

		if (scope) {
			catalog = await workspace.getCatalog(unscoped.value, ctx);
			if (!catalog) return;
			catalog = await catalog.repo.scopedCatalogs.getScopedCatalog(catalog.basePath, fs, scope, false);
			if (!catalog) return;
			articlePath = GitTreeFileProvider.scoped(articlePath, scope);
		} else {
			catalog = await workspace.getCatalog(catalogName, ctx);
			if (!catalog) return;
		}

		const article = catalog.findItemByItemPath<Article>(articlePath);
		if (!article) return;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		ifNotExistsErrorText && (await article.parsedContent.resourceManager.assertExists(src, ifNotExistsErrorText));

		const hashItem = new HashResourceManager(src, article.parsedContent.resourceManager);
		return { hashItem, mime };
	},

	params(ctx, q, body) {
		const src = new Path(q.src);
		const mimeType = q.mimeType as MimeTypes;
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, src, mimeType, catalogName, articlePath, ifNotExistsErrorText: body };
	},
});

export default get;
