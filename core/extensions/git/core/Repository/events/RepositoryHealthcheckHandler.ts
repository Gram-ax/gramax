import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import Path from "@core/FileProvider/Path/Path";
import { healthcheckEvents } from "@ext/git/core/GitCommands/errors/HealthcheckEvents";
import BrokenRepository from "@ext/git/core/Repository/BrokenRepository";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { Workspace } from "@ext/workspace/Workspace";
import assert from "assert";

export default class RepositoryHealthcheckHandler implements EventHandlerCollection {
	private _events = [];

	constructor(
		private _workspace: Workspace,
		private _rp: RepositoryProvider,
	) {}

	mount(): void {
		this._events.push(
			healthcheckEvents.on("healthcheck-failed", async ({ repoPath, error }) => {
				await this._onRepositoryHealthcheckFailed(repoPath, error);
			}),
		);
	}

	private async _onRepositoryHealthcheckFailed(repo: string, error: Error): Promise<void> {
		const fp = this._workspace.getFileProvider();

		const repoPath = new Path(repo);
		const workspacePath = new Path(this._workspace.path());

		if (!repoPath.startsWith(workspacePath)) return;

		const catalogName = workspacePath.subDirectory(repoPath).rootDirectory.nameWithExtension;
		assert(catalogName);

		const catalog = await this._workspace.getContextlessCatalog(catalogName);

		if (!catalog || catalog.repo instanceof BrokenRepository) return;

		catalog.setRepository(await this._rp.getRepositoryByPath(catalog.repo.path, fp, error));
	}
}
