import { ResponseKind } from "@app/types/ResponseKind";
import type Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import { initEnterpriseStorage } from "@ext/enterprise/utils/initEnterpriseStorage";
import { initEnterpriseCloudStorage } from "@ext/enterprise-cloud/utils/initEnterpriseCloudStorage";
import { makeSourceApi } from "@ext/git/actions/Source/makeSourceApi";
import type StorageData from "@ext/storage/models/StorageData";
import { Command } from "../../types/Command";

const init: Command<{ ctx: Context; catalogName: string; data: StorageData; articlePath?: Path }, string> =
	Command.create({
		path: "storage/init",

		kind: ResponseKind.plain,

		async do({ ctx, catalogName, articlePath, data }) {
			const { rp, wm, em, am, enterpriseCloudManager } = this._app;
			const workspace = wm.current();
			const workspaceConfig = await workspace.config();

			const catalog = await workspace.getContextlessCatalog(catalogName);
			if (!catalog) return;

			const cloudConfig = enterpriseCloudManager.getConfig();
			if (cloudConfig.url && cloudConfig.enabled !== false)
				await initEnterpriseCloudStorage(cloudConfig.url, data);
			else await initEnterpriseStorage(em.getConfig().gesUrl, data, ctx, am);

			await makeSourceApi(data.source, workspaceConfig.services?.auth?.url).assertStorageExist(data);
			const fp = workspace.getFileProvider();
			const repo = await rp.initNew(catalog.basePath, fp, data);
			catalog.setRepository(repo);
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
