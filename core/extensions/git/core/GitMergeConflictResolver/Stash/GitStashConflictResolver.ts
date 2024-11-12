/* eslint-disable @typescript-eslint/no-unused-vars */
import GitStash from "@ext/git/core/model/GitStash";
import { GitVersion } from "@ext/git/core/model/GitVersion";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import GitBaseConflictResolver from "../Base/GitBaseConflictResolver";
import type Repository from "@ext/git/core/Repository/Repository";
import type { RepositoryStashConflictState } from "@ext/git/core/Repository/state/RepositoryState";

export default class GitStashConflictResolver extends GitBaseConflictResolver {
	constructor(protected _repo: Repository, fp: FileProvider, pathToRep: Path) {
		super(_repo, fp, pathToRep);
	}

	async abortMerge(state: RepositoryStashConflictState, _data: SourceData): Promise<void> {
		await super.abortMerge(state);
		const commitHeadBefore = state.data.commitHeadBefore;
		if (commitHeadBefore) {
			await this._repo.gvc.hardReset(new GitVersion(commitHeadBefore));
		}
		const stashHash = new GitStash(state.data.stashHash);
		await this._repo.gvc.applyStash(stashHash);
	}

	async resolveConflictedFiles(
		files: { path: string; content: string }[],
		state: RepositoryStashConflictState,
		_data: SourceData,
	): Promise<void> {
		await super.resolveConflictedFiles(files, state);

		// to remove conflicted files in status
		await this._repo.gvc.add();
		const status = await this._repo.gvc.getChanges();
		await this._repo.gvc.restore(
			true,
			status.map((s) => s.path),
		);
		await this._repo.gvc.deleteStash(new GitStash(state.data.stashHash));
	}
}
