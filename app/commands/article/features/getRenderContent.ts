import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";

const getRenderContent: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; articleRelativePath: Path },
	{ title: string; path: string; content: RenderableTreeNodes; articleProps: ClientArticleProps }
> = Command.create({
	path: "article/features/getRenderContent",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, articlePath, articleRelativePath }) {
		const { parser, parserContextFactory, sitePresenterFactory, wm } = this._app;
		const workspace = wm.current();

		if (!articleRelativePath.value) return null;
		const path = articlePath.parentDirectoryPath.join(articleRelativePath);
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const article: Article = catalog.findItemByItemPath(path);
		if (!article) return null;
		await parseContent(article, catalog, ctx, parser, parserContextFactory);
		const sp = sitePresenterFactory.fromContext(ctx);
		return {
			path: path.value,
			title: article.getTitle(),
			content: article.parsedContent.renderTree,
			articleProps: sp.serializeArticleProps(article, await catalog?.getPathname(article)),
		};
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const articleRelativePath = new Path(q.articleRelativePath);
		return { ctx, catalogName, articlePath, articleRelativePath };
	},
});

export default getRenderContent;
