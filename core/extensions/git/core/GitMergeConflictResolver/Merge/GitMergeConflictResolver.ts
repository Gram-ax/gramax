
import type Repository from "@ext/git/core/Repository/Repository";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import GitBaseConflictResolver from "../Base/GitBaseConflictResolver";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";

export default class GitMergeConflictResolver extends GitBaseConflictResolver {
	constructor(protected _repo: Repository, fp: FileProvider, pathToRep: Path) {
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
		await gvc.add();
		await gvc.commit(`Merge branch '${state.data.theirs}' into ${currentBranch}`, data, [
			currentBranch,
			state.data.theirs,
		]);
		await this._repo.storage?.push(data);
	}
}
