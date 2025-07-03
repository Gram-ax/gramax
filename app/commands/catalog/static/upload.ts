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

const uploadStatic: Command<{ ctx: Context; catalogName: string }, void> = Command.create({
	path: "catalog/static/upload",
	kind: ResponseKind.none,

	async do({ ctx, catalogName }) {
		try {
			this._app.conf.isReadOnly = true;
			const { wm, sitePresenterFactory } = this._app;
			const catalog = await wm.current().getContextlessCatalog(catalogName);
			const zipFileProvider = await ZipFileProvider.create();
			const workspaceConfig = await wm.current().config();
			const cloudServiceUrl = workspaceConfig.services?.cloud?.url;
			if (!cloudServiceUrl) throw new Error("Cloud service URL is not set");
			const cloudApi = new VersionedCloudApi(cloudServiceUrl);
			if (!(await cloudApi.getServerState())) throw new DefaultError(t("cloud.error.failed-to-connect"));

			const htmlTemplate = await cloudApi.getTemplateHtml();
			const staticSiteBuilder = new StaticSiteBuilder(zipFileProvider, this._app, htmlTemplate);

			await staticSiteBuilder.generate(catalog, new Path());

			const buffer = await zipFileProvider.zip.generateAsync({ type: "nodebuffer" });

			await cloudApi.uploadStatic(catalogName, buffer);

			const catalogLink = (await sitePresenterFactory.fromContext(ctx).serializeCatalogProps(catalog)).link;
			const convertedCatalogLink = convertCatalogLink(catalogName, catalogLink);
			await cloudApi.uploadCatalogLink(catalogName, convertedCatalogLink);
		} finally {
			this._app.conf.isReadOnly = false;
		}
	},

	params(ctx, q) {
		return { ctx, catalogName: q.catalogName };
	},
});

export default uploadStatic;
