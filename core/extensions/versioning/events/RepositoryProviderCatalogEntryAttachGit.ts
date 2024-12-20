import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

export default class RepositoryProviderCatalogEntryAttachGit implements EventHandlerCollection {
	constructor(private _fs: FileStructure, private _rp: RepositoryProvider) {}

	mount(): void {
		this._rp.events.on("connect-repository", async ({ repo }) => {
			if (!repo) return;
			if (repo.isBare) return;
			const fp = this._fs.fp.default();
			const path = repo.gvc.getPath();
			const pathExists = await this._fs.fp.exists(path);
			if (!pathExists) return;

			const git = new GitCommands(fp, path);

			const gitfp = new GitTreeFileProvider(git);
			const headScopePath = GitTreeFileProvider.scoped(path, null);
			this._fs.fp.mount(headScopePath, gitfp);
		});
	}
}
