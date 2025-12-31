import { Command } from "@app/types/Command";
import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { TreeReadScope } from "@ext/git/core/GitCommands/model/GitCommandsModel";
import ScopedPageData from "@ext/git/core/ScopedCatalogs/ScopedPageData";
import assert from "assert";

const getScopedPageDataByCatalog: Command<
	{ catalogName: string; ctx: Context; scope?: TreeReadScope },
	ClientCatalogProps
> = Command.create({
	path: "page/getScopedPageDataByCatalog",

	kind: ResponseKind.json,

	async do({ catalogName, ctx, scope }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		assert(catalog);

		const fs = workspace.getFileStructure();
		const sp = this._app.sitePresenterFactory.fromContext(ctx);

		if (!scope) {
			return await sp.serializeCatalogProps(catalog);
		}

		assert(catalog.repo.gvc);
		const scopedPageData = new ScopedPageData(fs, sp);
		return await scopedPageData.getCatalogPageData(catalog, scope);
	},

	params(ctx, q) {
		const catalogName = q.catalogName;
		const scope = q.scope ? (JSON.parse(q.scope) as TreeReadScope) : undefined;
		return { ctx, catalogName, scope };
	},
});

export default getScopedPageDataByCatalog;
