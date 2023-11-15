import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { Article } from "@core/FileStructue/Article/Article";
import { ItemRef } from "@core/FileStructue/Item/Item";
import { ArticleProps } from "@core/SitePresenter/SitePresenter";
import { Command, ResponseKind } from "../../types/Command";

const updateProps: Command<{ ctx: Context; catalogName: string; props: ArticleProps }, ArticleProps> = Command.create({
	path: "item/updateProps",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware()],

	async do({ ctx, catalogName, props }) {
		const { lib, sitePresenterFactory } = this._app;

		const catalog = await lib.getCatalog(catalogName);
		const itemRef: ItemRef = { path: new Path(props.ref.path), storageId: props.ref.storageId };
		const item = catalog.findItemByItemRef(itemRef);

		if (!item) return;

		const newItem = await item.updateProps(props, catalog.getRootCategory().props);
		return sitePresenterFactory.fromContext(ctx).getArticleProps(newItem as Article);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const props = body;
		return { ctx, catalogName, props };
	},
});

export default updateProps;
