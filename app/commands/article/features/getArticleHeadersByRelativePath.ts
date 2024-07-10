import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { TitleItem } from "@core-ui/ContextServices/LinkTitleTooltip";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { getLevelTocItemsByRenderableTree } from "@ext/navigation/article/logic/createTocItems";

const getArticleHeadersByRelativePath: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; articleRelativePath: Path },
	TitleItem[]
> = Command.create({
	path: "article/features/getArticleHeadersByRelativePath",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, articlePath, articleRelativePath }) {
		const { parser, parserContextFactory, wm } = this._app;
		const workspace = wm.current();
		if (!articleRelativePath.value) return null;

		const path = articlePath.parentDirectoryPath.join(articleRelativePath);
		const catalog = await workspace.getCatalog(catalogName);
		const article: Article = catalog.findItemByItemPath(path);
		if (!article) return null;

		await parseContent(article, catalog, ctx, parser, parserContextFactory);

		const { renderTree } = article.parsedContent;
		if (!renderTree || typeof renderTree === "string") return null;

		const headersTocItem = getLevelTocItemsByRenderableTree(renderTree.children);
		if (headersTocItem.length === 0) return [];

		const minLevel = Math.min(...headersTocItem.map((node) => node.level));

		return headersTocItem.map((headerItem) => {
			return { level: headerItem.level - minLevel, url: headerItem.url, title: headerItem.title };
		});
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		const articleRelativePath = new Path(q.articleRelativePath);
		return { ctx, catalogName, articlePath, articleRelativePath };
	},
});

export default getArticleHeadersByRelativePath;
