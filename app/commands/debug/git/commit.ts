import GitCommands from "../../../../core/extensions/git/core/GitCommands/GitCommands";
import GitSourceData from "../../../../core/extensions/git/core/model/GitSourceData.schema";
import { defaultLanguage } from "../../../../core/extensions/localization/core/model/Language";
import { Command } from "../../../types/Command";

const commit: Command<{ catalogName: string; msg?: string }, void> = Command.create({
	async do({ catalogName, msg = "test" }) {
		const { wm } = this._app;
		const workspace = wm.current();

		const catalog = await workspace.getContextlessCatalog(catalogName);
		if (!catalog) throw new Error("no catalog found");
		const fp = workspace.getFileProvider();

		const storage = catalog.repo.storage;
		const name = await storage.getSourceName();
		const sourceData = this._app.rp.getSourceData(
			this._app.contextFactory.fromBrowser(defaultLanguage, {}).cookie,
			name,
		);
		const path = catalog.repo.gvc.getPath();
		const gr = new GitCommands(fp, path);
		await gr.add((await gr.status()).map((x) => x.path));
		await gr.commit(msg, sourceData as GitSourceData);
		await storage.updateSyncCount();
	},
});

export default commit;
