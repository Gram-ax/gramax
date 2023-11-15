import GitRepository from "../../../../core/extensions/git/core/GitRepository/GitRepository";
import Path from "../../../../core/logic/FileProvider/Path/Path";
import { Command } from "../../../types/Command";

const reset: Command<{ catalogName: string; staged: boolean; filePaths: string[] }, void> = Command.create({
	async do({ catalogName, staged, filePaths }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const path = (await catalog.getVersionControl()).getPath();
		const gr = new GitRepository({ corsProxy: conf.corsProxy }, fp, path);
		await gr.restore(
			staged,
			filePaths?.map((f) => new Path(f)),
		);
	},
});

export default reset;
