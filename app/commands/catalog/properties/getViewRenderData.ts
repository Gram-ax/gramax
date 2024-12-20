import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import ViewFilter, { OrderValue } from "@ext/properties/logic/ViewFilter";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/displays";
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
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return [];
		const itemFilters = new RuleProvider(ctx).getItemFilters();
		const allArticles = catalog.deref.getItems(itemFilters) as Article[];

		return await new ViewFilter(
			defs,
			orderby,
			groupby,
			select,
			allArticles,
			catalog.findItemByItemPath(articlePath),
			catalog,
			display,
		).getFilteredArticles();
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const articlePath = new Path(q.articlePath);
		return { ctx, catalogName, articlePath, ...body };
	},
});

export default getViewRenderData;
