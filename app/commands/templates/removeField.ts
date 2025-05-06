import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const removeField: Command<{ catalogName: string; ctx: Context; articlePath: string; field: string }, void> =
	Command.create({
		path: "templates/removeArticleField",

		kind: ResponseKind.json,

		async do({ catalogName, ctx, articlePath, field }) {
			const { wm, resourceUpdaterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			const templateProvider = catalog.templateProvider;
			await templateProvider.removeTemplateArticleField(articlePath, field, resourceUpdaterFactory, ctx);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = q.articlePath;
			const field = q.field;
			return { ctx, catalogName, articlePath, field };
		},
	});

export default removeField;
