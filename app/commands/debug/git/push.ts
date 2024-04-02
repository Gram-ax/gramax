import GitCommands from "../../../../core/extensions/git/core/GitCommands/GitCommands";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { defaultLanguage } from "../../../../core/extensions/localization/core/model/Language";
import { Command } from "../../../types/Command";

const push: Command<{ catalogName: string }, void> = Command.create({
	async do({ catalogName }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const name = await catalog.repo.storage.getSourceName();
		const sourceData = this._app.rp.getSourceData(
			this._app.contextFactory.fromBrowser(defaultLanguage, {}).cookie,
			name,
		);
		const path = catalog.repo.gvc.getPath();
		const gr = new GitCommands({ corsProxy: conf.services.cors.url }, fp, path);
		await gr.push(sourceData as GitSourceData);
	},
});

export default push;
