import GitCommands from "../../../../core/extensions/git/core/GitCommands/GitCommands";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const reset: Command<{ catalogName: string; staged: boolean; filePaths?: string[] }, void> = Command.create({
	async do({ catalogName, staged, filePaths }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const path = catalog.repo.gvc.getPath();
		const gr = new GitCommands({ corsProxy: conf.services.cors.url }, fp, path);
		await gr.restore(
			staged,
			filePaths ? filePaths.map((f) => new Path(f)) : (await gr.status()).map((x) => x.path),
		);
	},
});

export default reset;
