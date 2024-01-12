import GitCommands from "../../../../core/extensions/git/core/GitCommands/GitCommands";
import IsomorphicGitCommands from "../../../../core/extensions/git/core/GitCommands/Isomorphic/IsomorphicGitCommands";
import { Command } from "../../../types/Command";

const status: Command<{ catalogName: string; raw?: string }, void> = Command.create({
	async do({ catalogName, raw = false }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const path = catalog.repo.gvc.getPath();
		const gr = new GitCommands({ corsProxy: conf.corsProxy }, fp, path);
		console.log(
			raw
				? await (gr.inner() as IsomorphicGitCommands).rawStatus()
				: (await gr.status()).map((x) => ({
						path: x.path.value,
						type: x.type,
						isUntracked: x.isUntracked,
				  })),
		);
	},
});

export default status;
