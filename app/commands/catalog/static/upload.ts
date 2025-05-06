import { ResponseKind } from "@app/types/ResponseKind";
import Path from "@core/FileProvider/Path/Path";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import CloudApi from "@ext/static/logic/CloudApi";
import ZipFileProvider from "@ext/static/logic/ZipFileProvider";
import StaticSiteBuilder from "../../../../apps/gramax-cli/src/logic/StaticSiteBuilder";
import { Command } from "../../../types/Command";

const uploadStatic: Command<{ catalogName: string }, void> = Command.create({
	path: "catalog/static/upload",
	kind: ResponseKind.none,

	async do({ catalogName }) {
		try {
			this._app.conf.isReadOnly = true;
			const wm = this._app.wm;
			const catalog = await wm.current().getContextlessCatalog(catalogName);
			const zipFileProvider = await ZipFileProvider.create();
			const workspaceConfig = await wm.current().config();
			const cloudServiceUrl = workspaceConfig.services?.cloud?.url;
			if (!cloudServiceUrl) throw new Error("Cloud service URL is not set");
			const cloudApi = new CloudApi(cloudServiceUrl);
			if (!(await cloudApi.getServerState())) throw new DefaultError(t("cloud.error.failed-to-connect"));

			const htmlTemplate = await cloudApi.getTemplateHtml();
			const staticSiteBuilder = new StaticSiteBuilder(zipFileProvider, this._app, htmlTemplate);

			await staticSiteBuilder.generate(catalog, new Path());

			const buffer = await zipFileProvider.zip.generateAsync({ type: "nodebuffer" });

			await cloudApi.uploadStatic(catalogName, buffer);
		} finally {
			this._app.conf.isReadOnly = false;
		}
	},

	params(_, q) {
		return { catalogName: q.catalogName };
	},
});

export default uploadStatic;
