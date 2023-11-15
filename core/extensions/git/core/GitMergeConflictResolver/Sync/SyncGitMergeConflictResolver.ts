import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import SourceData from "../../../../storage/logic/SourceDataProvider/model/SourceData";
import { MergeFile } from "../../../actions/MergeConflictHandler/model/MergeFile";
import GitVersionControl from "../../GitVersionControl/GitVersionControl";
import GitStash from "../../model/GitStash";
import BaseGitMergeConflictResolver from "../Base/BaseGitMergeConflictResolver";

export default class SyncGitMergeConflictResolver {
	private _baseMerger: BaseGitMergeConflictResolver;
	constructor(private _gitVersionControl: GitVersionControl, fp: FileProvider, pathToRep: Path) {
		this._baseMerger = new BaseGitMergeConflictResolver(_gitVersionControl, fp, pathToRep);
	}

	async abortMerge(data: SourceData, stashHash: GitStash): Promise<void> {
		const oid = await this._gitVersionControl.stashParent(stashHash);
		await this._baseMerger.abortMerge(oid);
		await this._gitVersionControl.applyStash(data, stashHash);
	}

	async resolveConflictedFiles(files: MergeFile[], stashHash: GitStash): Promise<void> {
		await this._baseMerger.resolveConflictedFiles(files);
		await Promise.all(
			files.map(async (file) => {
				await this._gitVersionControl.restore(true, [new Path(file.path)]);
			}),
		);
		await this._gitVersionControl.deleteStash(stashHash);
	}
}
