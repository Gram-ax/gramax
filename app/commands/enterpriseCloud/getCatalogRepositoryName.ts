import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import assert from "assert";
import { Command } from "../../types/Command";

const getCatalogRepositoryName: Command<
	{ ctx: Context; oldCatalogName: string; catalogTitle: string },
	{ repositoryName: string; isRepositoryNameAlreadyExists: boolean }
> = Command.create({
	path: "enterpriseCloud/getCatalogRepositoryName",

	kind: ResponseKind.json,

	async do({ ctx, oldCatalogName, catalogTitle }) {
		const { wm, enterpriseCloudManager } = this._app;

		if (!oldCatalogName) throw new Error("oldCatalogName is required");
		if (!catalogTitle) throw new Error("catalogTitle is required");

		const workspace = wm.current();
		const catalog = await workspace.getCatalog(oldCatalogName, ctx);
		assert(catalog, `Catalog not found: ${oldCatalogName}`);

		const gesCloudApi = new GesCloudApi(enterpriseCloudManager.getConfig().url);
		const localCatalogRepositoryNames = Array.from(workspace.getAllCatalogs().values())
			.filter((catalog) => !catalog.repo.storage?.getSourceName() && catalog.name !== oldCatalogName)
			.map((catalog) => catalog.name);

		return gesCloudApi.getCatalogRepositoryName(catalogTitle, localCatalogRepositoryNames);
	},

	params(ctx, q) {
		return {
			ctx,
			oldCatalogName: decodeURIComponent(q.oldCatalogName ?? "").trim(),
			catalogTitle: decodeURIComponent(q.catalogTitle ?? "").trim(),
		};
	},
});

export default getCatalogRepositoryName;
