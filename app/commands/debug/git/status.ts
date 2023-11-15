import GitRepository from "../../../../core/extensions/git/core/GitRepository/GitRepository";
import IsomorphicGitRepository from "../../../../core/extensions/git/core/GitRepository/Isomorphic/IsomorphicGitRepository";
import { Command } from "../../../types/Command";

const status: Command<{ catalogName: string; raw?: string }, void> = Command.create({
	async do({ catalogName, raw = false }) {
		const { lib, conf } = this._app;
		const catalog = await lib.getCatalog(catalogName);
		const fp = lib.getFileProviderByCatalog(catalog);
		if (!catalog) throw new Error("no catalog found");

		const path = (await catalog.getVersionControl()).getPath();
		const gr = new GitRepository({ corsProxy: conf.corsProxy }, fp, path);
		console.log(
			raw
				? await (gr.inner() as IsomorphicGitRepository).rawStatus()
				: (await gr.status()).map((x) => ({
						path: x.path.value,
						type: x.type,
						isUntracked: x.isUntracked,
				  })),
		);
	},
});

export default status;
