import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { PrintableContent, PrintablePage } from "@ext/print/types";
import collectPrintablePages from "@ext/print/utils/collectPrintablePages";
import RuleProvider from "@ext/rules/RuleProvider";

const getPrintableContent: Command<
	{ ctx: Context; itemPath?: Path; isCategory: boolean; catalogName: string; titleNumber?: boolean },
	PrintableContent<PrintablePage>
> = Command.create({
	path: "item/getPrintableContent",
	kind: ResponseKind.json,

	async do({ ctx, catalogName, isCategory, itemPath, titleNumber }) {
		const { wm, parser, parserContextFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);
		const isCatalog = !itemPath?.value;
		const item = isCatalog
			? resolveRootCategory(catalog, catalog.props, ctx.contentLanguage)
			: catalog.findItemByItemPath(itemPath);

		const filters = new RuleProvider(ctx).getItemFilters();
		const pages: PrintablePage[] = [];
		const title = isCatalog ? catalog.props.title : item.getTitle() || item.getFileName();
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
			titleNumber,
		);

		return { title, items: pages };
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const titleNumber = q.titleNumber === "true";
		const itemPath = new Path(q.itemPath);
		const isCategory = q.isCategory === "true";
		return { ctx, itemPath, catalogName, isCategory, titleNumber };
	},
});

export default getPrintableContent;
