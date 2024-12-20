import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import type { Category } from "@core/FileStructue/Category/Category";
import { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { addExternalItems } from "@ext/localization/core/addExternalItems";
import { ContentLanguage } from "@ext/localization/core/model/Language";

const add: Command<{ ctx: Context; code: ContentLanguage; catalogName: string }, void> = Command.create({
	path: "catalog/language/add",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, code, catalogName }) {
		const { wm, resourceUpdaterFactory } = this._app;

		if (!code || !ContentLanguage[code]) throw new Error("No content language code provided");
		const catalog = await wm.current().getCatalog(catalogName, ctx);
		if (!catalog) throw new Error(`Catalog '${catalogName} not found`);
		if (!catalog.props.language) throw new Error(`Catalog '${catalogName}' hasn't main language set`);
		if (catalog.props.supportedLanguages.includes(code))
			throw new Error(`Catalog ${catalogName} already has language ${code}`);

		catalog.props.supportedLanguages.push(code);

		const filter = (item: Item) => item.type == ItemType.category;
		let languageCategory = catalog.findArticle(`${catalogName}/${code}`, [filter]) as Category;
		if (!languageCategory) languageCategory = await catalog.createCategory(code);

		await catalog.updateProps(catalog.props, resourceUpdaterFactory);

		await addExternalItems(
			catalog.getRootCategory(),
			languageCategory,
			catalog.getRootCategory().folderPath,
			languageCategory.folderPath,
			wm.current().getFileStructure(),
			catalog.props.supportedLanguages,
		);

		await wm.current().refreshCatalog(catalogName);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, code: q.code as ContentLanguage };
	},
});

export default add;
