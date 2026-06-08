import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type StorageData from "@ext/storage/models/StorageData";
import assert from "assert";
import { Command } from "../../types/Command";

const initNewCatalog: Command<
	{ ctx: Context; oldCatalogName: string; newCatalogName: string; data: StorageData },
	ClientCatalogProps
> = Command.create({
	path: "enterpriseCloud/initNewCatalog",

	kind: ResponseKind.json,

	async do({ ctx, oldCatalogName, newCatalogName, data }) {
		const { wm, sitePresenterFactory } = this._app;
		const workspace = wm.current();
		const catalog = await workspace.getCatalog(oldCatalogName, ctx);
		assert(catalog, `Catalog not found: ${oldCatalogName}`);

		await makeSourceApi(data.source).assertStorageExist(data);

		if (oldCatalogName !== newCatalogName) {
			await this._commands.catalog.updateProps.do({
				ctx,
				catalogName: oldCatalogName,
				props: { title: catalog.props.title, url: newCatalogName },
			});
		}

		await this._commands.versionControl.init.do({
			ctx,
			data,
			catalogName: newCatalogName,
		});

		const newCatalog = await workspace.getCatalog(newCatalogName, ctx);
		assert(newCatalog, `Catalog not found: ${newCatalogName}`);

		return sitePresenterFactory.fromContext(ctx).serializeCatalogProps(newCatalog);
	},

	params(ctx, q, body) {
		return {
			ctx,
			oldCatalogName: decodeURIComponent(q.oldCatalogName),
			newCatalogName: decodeURIComponent(q.newCatalogName),
			data: body as StorageData,
		};
	},
});

export default initNewCatalog;
