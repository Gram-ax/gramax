import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import { TitleItem } from "@core-ui/ContextServices/LinkTitleTooltip";
import {
	flatTitleItems,
	getTitleItemsByTocItems,
} from "@ext/markdown/elements/link/edit/logic/titleItemsActions/getTitleItemsByTocItems";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import getTocItems, { getLevelTocItemsByRenderableTree } from "@ext/navigation/article/logic/createTocItems";

const getArticleHeadersByRelativePath: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; articleRelativePath: Path },
	TitleItem[]
> = Command.create({
	path: "article/features/getArticleHeadersByRelativePath",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, articlePath, articleRelativePath }) {
		const { wm, parser, parserContextFactory } = this._app;
		if (!articleRelativePath.value) return [];
		const workspace = wm.current();

		const path = articlePath.parentDirectoryPath.join(articleRelativePath);
		const currentCatalog = await workspace.getCatalog(catalogName, ctx);
		const catalog = await workspace.getCatalog(
			linkCreator.getCatalogNameFromPath(
				articleRelativePath.value,
				articlePath,
				currentCatalog.getRootCategoryRef().path.parentDirectoryPath,
			),
			ctx,
		);

		const article: Article = catalog.findItemByItemPath(path);
		if (!article) return [];

		try {
			await parseContent(article, catalog, ctx, parser, parserContextFactory);
		} catch (e) {
			console.warn(e);
		}

		return await article.parsedContent.read((p) => {
			const renderTree = p.renderTree;
			if (!renderTree || typeof renderTree === "string") return [];

			const headersTocItem = getLevelTocItemsByRenderableTree(renderTree.children);
			if (headersTocItem.length === 0) return [];

			const tocItems = getTocItems(headersTocItem);
			const titleItems = getTitleItemsByTocItems(tocItems);

			const flatItems: TitleItem[] = [];
			flatTitleItems(titleItems, 0, flatItems);
			return flatItems;
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
