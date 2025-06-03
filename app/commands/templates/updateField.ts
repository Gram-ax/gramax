import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { JSONContent } from "@tiptap/core";

const updateField: Command<
	{ catalogName: string; ctx: Context; articlePath: string; field: string; content: JSONContent[] },
	void
> = Command.create({
	path: "templates/updateArticleField",

	kind: ResponseKind.json,

	async do({ catalogName, ctx, articlePath, field, content }) {
		const { wm, resourceUpdaterFactory, parser, parserContextFactory, formatter } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		const templateProvider = catalog.customProviders.templateProvider;

		await templateProvider.updateTemplateArticleField(
			articlePath,
			field,
			content,
			formatter,
			resourceUpdaterFactory,
			parser,
			parserContextFactory,
			ctx,
		);
	},

	params(ctx, q, body) {
		const catalogName = q.catalogName;
		const articlePath = q.articlePath;
		const field = q.field;
		const content = body;
		return { ctx, catalogName, articlePath, field, content };
	},
});

export default updateField;
