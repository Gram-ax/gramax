import { ResponseKind } from "@app/types/ResponseKind";
import Context from "@core/Context/Context";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import VersionedCloudApi from "@ext/static/logic/VersionedCloudApi";
import convertCatalogLink from "@ext/static/logic/convertCatalogLink";
import ZipFileProvider from "@ext/static/logic/ZipFileProvider";
import StaticSiteBuilder from "../../../../apps/gramax-cli/src/logic/StaticSiteBuilder";
import { Command } from "../../../types/Command";
import CloudUploadStatus from "@ext/static/logic/CloudUploadStatus";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";

const uploadStatic: Command<{ ctx: Context; catalogName: string }, void> = Command.create({
	path: "catalog/cloud/upload",
	kind: ResponseKind.none,

	async do({ ctx, catalogName }) {
		const baseCatalogName = BaseCatalog.parseName(catalogName).name;
		try {
			this._app.conf.isReadOnly = true;
			const { wm, sitePresenterFactory } = this._app;
			const workspace = wm.current();

			const catalog = await workspace.getContextlessCatalog(baseCatalogName);
			const zipFileProvider = await ZipFileProvider.create();
			const workspaceConfig = await workspace.config();
			const cloudServiceUrl = workspaceConfig.services?.cloud?.url;
			if (!cloudServiceUrl) throw new Error("Cloud service URL is not set");
			const cloudApi = new VersionedCloudApi(cloudServiceUrl);
			if (!(await cloudApi.getServerState())) throw new DefaultError(t("cloud.error.failed-to-connect"));

			const htmlTemplate = await cloudApi.getTemplateHtml();
			const staticSiteBuilder = new StaticSiteBuilder(zipFileProvider, this._app, htmlTemplate);

			const getCustomStyleCommand = this._commands.workspace.assets.getCustomStyle;
			const customStyles = await getCustomStyleCommand.do({ workspacePath: workspace.path() });
			await staticSiteBuilder.generate(catalog, new Path(), { customStyles });

			const buffer = await zipFileProvider.zip.generateAsync({ type: "nodebuffer" });

			await cloudApi.uploadStatic(baseCatalogName, buffer);

			const catalogLink = (await sitePresenterFactory.fromContext(ctx).serializeCatalogProps(catalog)).link;
			const convertedCatalogLink = convertCatalogLink(baseCatalogName, catalogLink);
			await cloudApi.uploadCatalogLink(baseCatalogName, convertedCatalogLink);
		} finally {
			CloudUploadStatus.delete(baseCatalogName);
			this._app.conf.isReadOnly = false;
		}
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default uploadStatic;
