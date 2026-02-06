import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import parseContent from "@core/FileStructue/Article/parseContent";
import HiddenRules from "@core/FileStructue/Rules/HiddenRules/HiddenRule";
import { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import SecurityRules from "@ext/security/logic/SecurityRules";

const getRenderContent: Command<
	{ ctx: Context; articlePath: Path; catalogName: string; articleRelativePath: Path },
	{ title: string; path: string; content: RenderableTreeNodes; articleProps: ClientArticleProps }
> = Command.create({
	path: "article/features/getRenderContent",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, articlePath, articleRelativePath }) {
		const { parser, parserContextFactory, sitePresenterFactory, wm } = this._app;
		const workspace = wm.current();
		let error = null;
		let errorArticleData = { title: "", content: "" };

		if (!articleRelativePath.value) return null;
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
		if (!catalog) return null;
		const article: Article = catalog.findItemByItemPath(path);
		if (!article) return null;

		const securityFilter = new SecurityRules(ctx.user).getItemFilter();
		const securityFilterStatus = securityFilter(article, catalog);

		const filter = new HiddenRules().getItemFilter();
		const hiddenFilterStatus = filter(article, catalog);

		if (!securityFilterStatus || !hiddenFilterStatus) return null;

		const sp = sitePresenterFactory.fromContext(ctx);

		try {
			await parseContent(article, catalog, ctx, parser, parserContextFactory);
		} catch (e) {
			error = e;
			errorArticleData = await this._commands.article.features.getCustomArticle.do({
				name: "500",
				props: {
					type: "Parse",
				},
			});

			errorArticleData.content = JSON.parse(errorArticleData.content);
		}

		return {
			path: path.value,
			title: error ? errorArticleData.title : article.getTitle(),
			content: error ? errorArticleData.content : await article.parsedContent.read((p) => p.renderTree),
			articleProps: await sp.serializeArticleProps(article, await catalog?.getPathname(article)),
			error,
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
