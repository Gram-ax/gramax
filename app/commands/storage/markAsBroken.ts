import Path from "@core/FileProvider/Path/Path";
import { LibGit2Error } from "@ext/git/core/GitCommands/errors/LibGit2Error";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import { Command } from "../../types/Command";


// todo: TO BE DELETED; UNHOLY SOLUTION
const markAsBroken: Command<{ catalogName: string; message?: string }, void> = Command.create({
	path: "storage/markAsBroken",

	async do({ catalogName, message }) {
		const { wm } = this._app;

		const workspace = wm.current();
		const catalog = await workspace.getContextlessCatalog(catalogName);
		const fp = workspace.getFileProvider();

		const repo = catalog.repo;

		await fp.write(repo.path.join(new Path(".git/.gx-lock")), "");

		const broken = new BrokenRepository(repo.path, fp, repo.gvc, repo.storage);
		const err = new LibGit2Error("LibGit2Error", message ?? "healthcheck failed", 1001, 0);
		catalog.setRepository(broken.withError(err));
	},

	params(_, q) {
		return { catalogName: q.catalogName, message: q.message };
	},
});

export default markAsBroken;
