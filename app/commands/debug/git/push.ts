import GitRepository from "../../../../core/extensions/git/core/GitRepository/GitRepository";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { defaultLanguage } from "../../../../core/extensions/localization/core/model/Language";
import { Command } from "../../../types/Command";

const push: Command<{ catalogName: string }, void> = Command.create({
	async do({ catalogName }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const name = await catalog.getStorage().getSourceName();
		const sourceData = this._app.sp.getSourceData(
			this._app.contextFactory.fromBrowser(defaultLanguage, {}).cookie,
			name,
		);
		const path = (await catalog.getVersionControl()).getPath();
		const gr = new GitRepository({ corsProxy: conf.corsProxy }, fp, path);
		await gr.push(sourceData as GitSourceData);
	},
});

export default push;
