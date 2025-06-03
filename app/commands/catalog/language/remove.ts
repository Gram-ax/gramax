import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import { AuthorizeMiddleware } from "@core/Api/middleware/AuthorizeMiddleware";
import { DesktopModeMiddleware } from "@core/Api/middleware/DesktopModeMiddleware";
import ReloadConfirmMiddleware from "@core/Api/middleware/ReloadConfirmMiddleware";
import type Context from "@core/Context/Context";
import type { Item } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import assert from "assert";

const remove: Command<{ ctx: Context; code: ContentLanguage; catalogName: string }, void> = Command.create({
	path: "catalog/language/remove",

	middlewares: [new AuthorizeMiddleware(), new DesktopModeMiddleware(), new ReloadConfirmMiddleware()],

	kind: ResponseKind.none,

	async do({ ctx, code, catalogName }) {
		const { wm, resourceUpdaterFactory } = this._app;

		assert(code && ContentLanguage[code], "No content language code provided");
		const catalog = await wm.current().getCatalog(catalogName, ctx);
		assert(catalog, `Catalog '${catalogName} not found`);
		assert(catalog.props.language, `Catalog '${catalogName}' hasn't main language set`);
		assert(catalog.props.supportedLanguages.includes(code), `Catalog ${catalogName} hasn't language ${code}`);

		assert(catalog.props.language != code, "You can't delete main language");

		catalog.props.supportedLanguages = catalog.props.supportedLanguages.filter((l) => l != code);

		const filter = (item: Item) => item.type == ItemType.category;
		const languageCategory = catalog.findArticle(`${catalogName}/${code}`, [filter]);

		if (languageCategory) await catalog.deleteItem(languageCategory.ref, null, false);

		const props = catalog.props;
		if (props.supportedLanguages?.length <= 1) {
			props.language = null;
			props.supportedLanguages = [];
		}

		await catalog.updateProps(catalog.props, resourceUpdaterFactory);
		await wm.current().refreshCatalog(catalogName);
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName, code: q.code as ContentLanguage };
	},
});

export default remove;
