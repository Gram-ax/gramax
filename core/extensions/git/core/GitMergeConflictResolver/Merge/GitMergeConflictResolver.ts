import type Repository from "@ext/git/core/Repository/Repository";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import GitBaseConflictResolver from "../Base/GitBaseConflictResolver";

export default class GitMergeConflictResolver extends GitBaseConflictResolver {
	constructor(
		protected _repo: Repository,
		fp: FileProvider,
		pathToRep: Path,
	) {
		super(_repo, fp, pathToRep);
	}

	async abortMerge(state: RepositoryMergeConflictState, data: SourceData): Promise<void> {
		await super.abortMerge(state);
		const branchNameBefore = state.data.branchNameBefore;
		if (branchNameBefore) {
			await this._repo.checkout({ data, branch: branchNameBefore });
		}
	}

	async resolveConflictedFiles(
		files: { path: string; content: string }[],
		state: RepositoryMergeConflictState,
		data: SourceData,
	): Promise<void> {
		await super.resolveConflictedFiles(files, state);
		const gvc = this._repo.gvc;

		const currentBranch = (await gvc.getCurrentBranch()).toString();
		await gvc.add(null, true);
		const parents = state.data.squash ? [currentBranch] : [currentBranch, state.data.theirs];
		const message = await gvc.formatMergeMessage(data, {
			theirs: state.data.theirs,
			squash: state.data.squash,
			isMergeRequest: state.data.isMergeRequest,
		});
		await gvc.commit(message, data, parents);
		await this._repo.storage?.push(data);
	}
}
