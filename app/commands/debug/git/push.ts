import GitCommands from "../../../../core/extensions/git/core/GitCommands/GitCommands";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { defaultLanguage } from "../../../../core/extensions/localization/core/model/Language";
import { Command } from "../../../types/Command";

const push: Command<{ catalogName: string }, void> = Command.create({
	async do({ catalogName }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getCatalog(catalogName);
		if (!catalog) throw new Error("no catalog found");
		const fp = workspace.getFileProvider();

		const name = await catalog.repo.storage.getSourceName();
		const sourceData = this._app.rp.getSourceData(
			this._app.contextFactory.fromBrowser(defaultLanguage, {}).cookie,
			name,
		);
		const path = catalog.repo.gvc.getPath();
		const gr = new GitCommands(fp, path);
		await gr.push(sourceData as GitSourceData);
	},
});

export default push;
