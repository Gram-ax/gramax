import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { PrintablePage } from "@ext/print/types";
import collectPrintablePages from "@ext/print/utils/collectPrintablePages";
import RuleProvider from "@ext/rules/RuleProvider";

const getPrintableContent: Command<
	{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string },
	PrintablePage[]
> = Command.create({
	path: "item/getPrintableContent",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, isCategory, itemPath }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const isCatalog = !itemPath?.value;
		const item = isCatalog
			? resolveRootCategory(catalog, catalog.props, ctx.contentLanguage)
			: catalog.findItemByItemPath(itemPath);

		const filters = new RuleProvider(ctx).getItemFilters();
		const pages: PrintablePage[] = [];

		await collectPrintablePages(
			item,
			catalog,
			ctx,
			filters,
			parser,
			parserContextFactory,
			pages,
			isCategory,
			isCatalog,
		);

		return pages;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const itemPath = new Path(q.itemPath);
		const isCategory = q.isCategory === "true";
		return { ctx, itemPath, catalogName, isCategory };
	},
});

export default getPrintableContent;
