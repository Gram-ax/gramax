import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import CatalogExistsError from "@ext/storage/models/CatalogExistsError";
import assert from "assert";
import { Command } from "../../types/Command";

export const INIT_NEW_CATALOG_REPOSITORY_ALREADY_EXISTS = "REPOSITORY_ALREADY_EXISTS" as const;

export type InitNewCatalogResult =
	| { success: true; catalogProps: ClientCatalogProps }
	| { success: false; errorCode: typeof INIT_NEW_CATALOG_REPOSITORY_ALREADY_EXISTS };

const initNewCatalog: Command<
	{ ctx: Context; oldCatalogName: string; newCatalogTitle: string; newRepositoryName: string },
	InitNewCatalogResult
> = Command.create({
	path: "enterpriseCloud/initNewCatalog",

	kind: ResponseKind.json,

	async do({ ctx, oldCatalogName, newCatalogTitle, newRepositoryName }) {
		const { wm, sitePresenterFactory, enterpriseCloudManager } = this._app;

		if (!oldCatalogName) throw new Error("oldCatalogName is required");
		if (!newRepositoryName) throw new Error("newRepositoryName is required");

		const workspace = wm.current();
		const catalog = await workspace.getCatalog(oldCatalogName, ctx);
		assert(catalog, `Catalog not found: ${oldCatalogName}`);

		const localCatalogRepositoryNames = Array.from(workspace.getAllCatalogs().values())
			.filter((catalog) => !catalog.repo.storage?.getSourceName() && catalog.name !== oldCatalogName)
			.map((catalog) => catalog.name);

		if (localCatalogRepositoryNames.includes(newRepositoryName)) {
			return { success: false, errorCode: INIT_NEW_CATALOG_REPOSITORY_ALREADY_EXISTS };
		}

		const sourceDatas = this._app.rp.getSourceDatas(ctx, workspace.path());

		const gitlabSourceData = sourceDatas.find((sourceData) => sourceData.sourceType === SourceType.gitLab);
		const gesCloudApi = new GesCloudApi(enterpriseCloudManager.getConfig().url);
		const initData = await gesCloudApi.getCatalogInitData();

		const data: GitStorageData = {
			source: gitlabSourceData as GitSourceData,
			name: newRepositoryName,
			group: initData.git.group,
		};

		try {
			await makeSourceApi(data.source).assertStorageExist(data);
		} catch (error) {
			if (error instanceof CatalogExistsError) {
				return { success: false, errorCode: INIT_NEW_CATALOG_REPOSITORY_ALREADY_EXISTS };
			}

			throw error;
		}

		if (catalog.props.title !== newCatalogTitle || oldCatalogName !== newRepositoryName) {
			await this._commands.catalog.updateProps.do({
				ctx,
				catalogName: oldCatalogName,
				props: { title: newCatalogTitle, url: newRepositoryName },
			});
		}

		await this._commands.versionControl.init.do({
			ctx,
			data,
			catalogName: newRepositoryName,
		});

		const newCatalog = await workspace.getCatalog(newRepositoryName, ctx);
		assert(newCatalog, `Catalog not found: ${newRepositoryName}`);

		return {
			success: true,
			catalogProps: await sitePresenterFactory.fromContext(ctx).serializeCatalogProps(newCatalog),
		};
	},

	params(ctx, q) {
		return {
			ctx,
			oldCatalogName: decodeURIComponent(q.oldCatalogName ?? "").trim(),
			newCatalogTitle: decodeURIComponent(q.newCatalogTitle ?? "").trim(),
			newRepositoryName: decodeURIComponent(q.newRepositoryName ?? "").trim(),
		};
	},
});

export default initNewCatalog;
