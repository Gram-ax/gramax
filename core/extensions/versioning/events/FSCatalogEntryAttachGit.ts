import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

export default class FSCatalogEntryAttachGit implements EventHandlerCollection {
	constructor(private _fs: FileStructure) {}

	mount(): void {
		this._fs.events.on("before-catalog-entry-read", async ({ path, initProps }) => {
			const fp = this._fs.fp.default();

			const isNotCloningOrResolved = !initProps.isCloning && !initProps.resolvedVersions;
			const pathExists = await this._fs.fp.exists(path);

			if (isNotCloningOrResolved && pathExists) {
				const items = await fp.readdir(path);
				const isGitRepository = items.includes(".git") || path.value.endsWith(".git");

				if (isGitRepository) {
					const git = new GitCommands(fp, path);
					const gitfp = new GitTreeFileProvider(git);

					if (await git.isBare()) {
						const hasSubmodules = await fp.exists(path.join(new Path(".gitmodules")));

						if (hasSubmodules) {
							const errorMessage = `Repository ${git.repoPath.value} is bare but has submodules; submodules aren't currently supported`;
							throw new Error(errorMessage);
						}

						this._fs.fp.mount(path, gitfp);
					} else {
						const headScopePath = GitTreeFileProvider.scoped(path, null);
						this._fs.fp.mount(headScopePath, gitfp);
					}
				}
			}
		});
	}
}
