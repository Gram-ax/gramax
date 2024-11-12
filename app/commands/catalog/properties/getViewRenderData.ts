import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import ViewFilter from "@ext/properties/logic/ViewFilter";
import { PropertyValue, ViewRenderGroup } from "@ext/properties/models";
import { Display } from "@ext/properties/models/displays";

const getViewRenderData: Command<
	{
		catalogName: string;
		defs: PropertyValue[];
		orderby: string[];
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

	async do({ display, catalogName, defs, orderby, groupby, select, articlePath }) {
		const { wm } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) return [];
		const allArticles = catalog.getItems() as Article[];

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
