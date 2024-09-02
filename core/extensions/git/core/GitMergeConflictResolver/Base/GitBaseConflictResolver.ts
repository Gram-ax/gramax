/* eslint-disable @typescript-eslint/no-unused-vars */
import { MergeConflictParser } from "@ext/git/actions/MergeConflictHandler/Monaco/logic/mergeConflictParser";
import haveConflictWithFileDelete from "@ext/git/actions/MergeConflictHandler/logic/haveConflictWithFileDelete";
import GitMergeResult from "@ext/git/actions/MergeConflictHandler/model/GitMergeResult";
import Repository from "@ext/git/core/Repository/Repository";
import { RepState } from "@ext/git/core/Repository/model/RepostoryState";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import FileStructure from "../../../../../logic/FileStructue/FileStructure";
import { GitMergeResultContent } from "../../../actions/MergeConflictHandler/model/GitMergeResultContent";

export default class GitBaseConflictResolver {
	constructor(protected _repo: Repository, private _fp: FileProvider, private _pathToRep: Path) {}

	async abortMerge(_state: RepState, _sourceData?: SourceData): Promise<void> {
		await this._repo.gvc.hardReset();
	}

	async convertToMergeResultContent(
		mergeResult: GitMergeResult[],
		fs?: FileStructure,
	): Promise<GitMergeResultContent[]> {
		return Promise.all(
			mergeResult.map(async (r): Promise<GitMergeResultContent> => {
				let content = "";
				if (await this._fp.exists(this._toRootPath(r.path)))
					content = await this._fp.read(this._toRootPath(r.path));
				return {
					content,
					path: r.path,
					status: r.status,
					title: fs ? fs.parseMarkdown(content).props.title ?? "" : "",
				};
			}),
		);
	}

	async resolveConflictedFiles(
		files: { path: string; content: string }[],
		_state: RepState,
		_sourceData?: SourceData,
	): Promise<void> {
		await Promise.all(
			files.map(async (file) => {
				if (file.content) await this._fp.write(this._toRootPath(file.path), file.content);
				else await this._fp.delete(this._toRootPath(file.path));
			}),
		);
	}

	async isMergeStateValidate(files: GitMergeResult[]): Promise<boolean> {
		if (!files.length) return false;
		const fileContents: string[] = [];
		for (const file of files) {
			if (haveConflictWithFileDelete(file.status)) continue;
			if (!(await this._fp.exists(this._toRootPath(file.path)))) continue;
			fileContents.push(await this._fp.read(this._toRootPath(file.path)));
		}
		if (!fileContents.length) return true;
		return fileContents.every((c) => MergeConflictParser.containsConflict(c));
	}

	private _toRootPath(path: string): Path {
		return this._pathToRep.join(new Path(path));
	}
}
