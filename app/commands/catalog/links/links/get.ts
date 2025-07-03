import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { Link } from "@ext/properties/logic/CatalogLinksProvider";

const get: Command<{ ctx: Context; catalogName: string; articlePath: string }, Link[]> = Command.create({
	path: "catalog/links/links/get",

	kind: ResponseKind.json,

	async do({ catalogName, articlePath, ctx }) {
		const { sitePresenterFactory } = this._app;
		const workspace = this._app.wm.current();
		const catalog = await workspace.getCatalog(catalogName, ctx);

		if (!catalog) return;
		const provider = catalog.customProviders.linksProvider;

		if (!provider.isParsed) {
			const sp = sitePresenterFactory.fromContext(ctx);
			await sp.parseAllItems(catalog);
		}

		const links = await provider.getArticleLinks(articlePath);
		const formattedLinks = await provider.getFormattedLinks(links);

		return formattedLinks;
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const articlePath = q.articlePath;
		return { ctx, catalogName, articlePath };
	},
});

export default get;
