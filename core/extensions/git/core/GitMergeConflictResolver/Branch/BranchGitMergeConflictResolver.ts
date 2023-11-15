import { GitVersion } from "@ext/git/core/model/GitVersion";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { MergeFile } from "../../../actions/MergeConflictHandler/model/MergeFile";
import GitVersionControl from "../../GitVersionControl/GitVersionControl";
import BaseGitMergeConflictResolver from "../Base/BaseGitMergeConflictResolver";

export default class BranchGitMergeConflictResolver {
	private _baseMerger: BaseGitMergeConflictResolver;
	constructor(private _gitVersionControl: GitVersionControl, fp: FileProvider, pathToRep: Path) {
		this._baseMerger = new BaseGitMergeConflictResolver(_gitVersionControl, fp, pathToRep);
	}

	async abortMerge(theirBranch: string, headBeforeMerge?: GitVersion): Promise<void> {
		await this._baseMerger.abortMerge(headBeforeMerge);
		await this._gitVersionControl.checkoutToBranch(theirBranch);
	}

	async resolveConflictedFiles(theirsBranch: string, files: MergeFile[], sourceData: SourceData): Promise<void> {
		await this._baseMerger.resolveConflictedFiles(files);
		const currentBranch = (await this._gitVersionControl.getCurrentBranch()).toString();
		const status = await this._gitVersionControl.getChanges(false);
		await this._gitVersionControl.add(status.map((f) => f.path));
		await this._gitVersionControl.commit(`Merge branch '${theirsBranch}' into ${currentBranch}`, sourceData, [
			currentBranch,
			theirsBranch,
		]);
	}
}
