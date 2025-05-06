import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import Context from "@core/Context/Context";
import { Command } from "../../types/Command";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";

const setSyntax: Command<{ ctx: Context; catalogName: string; syntax: Syntax }, void> = Command.create({
	path: "catalog/setSyntax",

	kind: ResponseKind.json,

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	async do({ ctx, catalogName, syntax }) {
		const { wm, sitePresenterFactory, resourceUpdaterFactory, parser, parserContextFactory, formatter } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName, ctx);
		if (!catalog) return;
		if (catalog.props.syntax !== syntax) {
			catalog.props.syntax = syntax;
			await catalog.updateProps(catalog.props, resourceUpdaterFactory);
		}

		await sitePresenterFactory.fromContext(ctx).parseAllItems(catalog);
		for (const article of catalog.getContentItems()) {
			const editTree = (await article.parsedContent?.read())?.editTree;
			if (!editTree) continue;
			await this._commands.article.updateContent.do({
				ctx,
				articlePath: article.ref.path,
				catalogName,
				editTree,
			});
		}

		// const snippetProvider = catalog.snippetProvider;
		// for (const snippet of snippetProvider.getListData()) {
		// 	const snippetEditData = await snippetProvider.getEditData(snippet.id, parser);
		// 	await this._commands.elements.snippet.edit.do({
		// 		ctx,
		// 		oldSnippetId: snippet.id,
		// 		snippetEditData,
		// 		catalogName,
		// 	});
		// }

		// const inboxProvider = catalog.inboxProvider;
		// for (const inbox of await inboxProvider.getArticles(parser, parserContextFactory, ctx)) {
		// 	await inboxProvider.updateContent(
		// 		inbox.ref.path,
		// 		inbox.content,
		// 		formatter,
		// 		parserContextFactory,
		// 		parser,
		// 		ctx,
		// 	);
		// }
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const syntax = q.syntax as Syntax;
		return { ctx, catalogName, syntax };
	},
});

export default setSyntax;
