import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";

const setAsTemplate: Command<{ catalogName: string; ctx: Context; articlePath: string; templateId: string }, void> =
	Command.create({
		path: "templates/setArticleAsTemplate",

		kind: ResponseKind.json,

		async do({ catalogName, ctx, articlePath, templateId }) {
			const { wm, resourceUpdaterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getCatalog(catalogName, ctx);
			const templateProvider = catalog.templateProvider;
			await templateProvider.setArticleAsTemplate(articlePath, templateId, resourceUpdaterFactory, ctx);
		},

		params(ctx, q) {
			const catalogName = q.catalogName;
			const articlePath = q.articlePath;
			const templateId = q.templateId;
			return { ctx, catalogName, articlePath, templateId };
		},
	});

export default setAsTemplate;
