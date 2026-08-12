import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import type FileStructure from "@core/FileStructue/FileStructure";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitTreeFileProvider from "@ext/versioning/GitTreeFileProvider";

export default class FSCatalogEntryAttachGit implements EventHandlerCollection {
	constructor(private _fs: FileStructure) {}

	mount(): void {
		this._fs.events.on("before-catalog-entry-read", async ({ path, initProps }) => {
			if (initProps.isCloning || initProps.resolvedVersions) return;
			if (getExecutingEnvironment() === "cli") return;

			const fp = this._fs.fp.default();
			const fromNative = initProps.isGitRepo !== undefined;

			let isGitRepository: boolean;
			let isBare: boolean | undefined;
			let hasSubmodules: boolean | undefined;

			if (fromNative) {
				isGitRepository = !!initProps.isGitRepo;
				isBare = !!initProps.isBareRepo;
				hasSubmodules = !!initProps.hasGitmodules;
			} else {
				const pathExists = await this._fs.fp.exists(path);
				if (!pathExists) return;
				const items = await fp.readdir(path);
				isGitRepository = items.includes(".git") || path.value.endsWith(".git");
			}

			if (!isGitRepository) return;

			const git = new GitCommands(fp, path);
			const gitfp = new GitTreeFileProvider(git);

			try {
				if (isBare === undefined) isBare = await git.isBare();
				if (isBare) {
					if (hasSubmodules === undefined)
						hasSubmodules = await fp.exists(path.join(new Path(".gitmodules")));
					if (hasSubmodules) {
						const errorMessage = `Repository ${git.repoPath.value} is bare but has submodules; submodules aren't currently supported`;
						throw new Error(errorMessage);
					}

					this._fs.fp.mount(path, gitfp);
				} else {
					const headScopePath = GitTreeFileProvider.scoped(path, null);
					this._fs.fp.mount(headScopePath, gitfp);
				}
			} catch {}
		});
	}
}
