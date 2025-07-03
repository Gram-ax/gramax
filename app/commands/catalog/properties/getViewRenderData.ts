import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import ViewFilter, { OrderValue } from "@ext/properties/logic/ViewFilter";
import ViewLocalizationFilter from "@ext/properties/logic/viewLocalizationFilter";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/display";
import RuleProvider from "@ext/rules/RuleProvider";

const getViewRenderData: Command<
	{
		ctx: Context;
		catalogName: string;
		defs: PropertyValue[];
		orderby: OrderValue[];
		groupby: string[];
		select: string[];
		display: Display;
		articlePath: Path;
	},
	ViewRenderGroup[]
> = Command.create({
	path: "catalog/view/getRenderData",

	kind: ResponseKind.json,

	middlewares: [new ReloadConfirmMiddleware()],

	async do({ display, catalogName, defs, orderby, groupby, select, articlePath, ctx }) {
		const { wm, parserContextFactory, parser } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return [];
		const itemFilters = [
			...new RuleProvider(ctx, undefined, undefined).getItemFilters(),
			new ViewLocalizationFilter().getItemFilter(),
		];

		const allArticles = catalog.deref.getItems(itemFilters) as Article[];
		const currentArticle = catalog.findItemByItemPath<Article>(articlePath);
		if (!currentArticle) return [];

		return await new ViewFilter(
			defs,
			orderby,
			groupby,
			select,
			allArticles,
			currentArticle,
			catalog,
			display,
			itemFilters,
			parserContextFactory,
			parser,
			ctx,
		).getFilteredArticles();
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath, ...body };
	},
});

export default getViewRenderData;
