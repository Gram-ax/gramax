import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ArticleProps } from "@core/SitePresenter/SitePresenter";
import { Command, ResponseKind } from "../../types/Command";

const getProps: Command<{ catalogName: string; articlePath: Path; ctx: Context }, ArticleProps> = Command.create({
	path: "article/getProps",

	kind: ResponseKind.json,

	async do({ catalogName, articlePath, ctx }) {
		const { lib, sitePresenterFactory } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProvider(catalog.getRootCategoryRef().storageId);
		const itemRef = fp.getItemRef(articlePath);
		const article = catalog.findItemByItemRef(itemRef) as Article;
		if (!article) return;
		return sitePresenterFactory.fromContext(ctx).getArticleProps(article);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.path);
		return { ctx, catalogName, articlePath };
	},
});

export default getProps;
