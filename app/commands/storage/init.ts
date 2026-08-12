import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { applyWorkspaceLfsMigration } from "@ext/enterprise/lfs/workspaceLfsMigration";
import { initEnterpriseStorage } from "@ext/enterprise/utils/initEnterpriseStorage";
import { initEnterpriseCloudStorage } from "@ext/enterprise-cloud/utils/initEnterpriseCloudStorage";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import { span } from "@ext/loggers/opentelemetry";
import type StorageData from "@ext/storage/models/StorageData";
import isCatalogReadOnly from "@ext/workspace/utils/isCatalogReadOnly";
import { Command } from "../../types/Command";

const init: Command<{ ctx: Context; catalogName: string; data: StorageData; articlePath?: Path }, string> =
	Command.create({
		path: "storage/init",

		kind: ResponseKind.plain,

		async do({ ctx, catalogName, articlePath, data }) {
			const { rp, wm, em, am, enterpriseCloudManager } = this._app;
			const workspace = wm.current();
			const services = this._app.settings.resolveServices(workspace);

			const catalog = await workspace.getContextlessCatalog(catalogName);
			if (!catalog) return;

			const cloudConfig = enterpriseCloudManager.getConfig();
			if (cloudConfig.url && cloudConfig.enabled !== false)
				await initEnterpriseCloudStorage(cloudConfig.url, data);
			else await initEnterpriseStorage(em.getConfig().gesUrl, data, ctx, am);

			await makeSourceApi(data.source, services?.auth?.endpoint).assertStorageExist(data);
			const fp = workspace.getFileProvider();
			const repo = await rp.initNew(catalog, fp, data);
			catalog.setRepository(repo);
			try {
				if (!(await isCatalogReadOnly(this._app, workspace, ctx, catalog))) {
					const sourceData = rp.getSourceData(ctx, await repo.storage.getSourceName());
					if (sourceData) await applyWorkspaceLfsMigration(workspace, catalog, sourceData);
				}
			} catch (e) {
				span()?.addEvent("lfs-migration-failed", { error: String(e) });
			}
			const item = articlePath ? catalog.findItemByItemPath(articlePath) : undefined;
			return await catalog.getPathname(item);
		},

		params(ctx, q, body) {
			const catalogName = q.catalogName;
			const articlePath = new Path(q.articlePath);
			return { ctx, catalogName, articlePath, data: body };
		},
	});

export default init;
