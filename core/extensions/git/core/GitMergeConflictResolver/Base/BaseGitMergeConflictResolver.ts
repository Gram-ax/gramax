import { FileStatus } from "@ext/Watchers/model/FileStatus";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import FileStructure from "../../../../../logic/FileStructue/FileStructure";
import { FIND_MERGE_CONFLICT } from "../../../actions/MergeConflictHandler/logic/mergeRegExps";
import { MergeFile } from "../../../actions/MergeConflictHandler/model/MergeFile";
import GitVersionControl from "../../GitVersionControl/GitVersionControl";
import { GitVersion } from "../../model/GitVersion";

export default class BaseGitMergeConflictResolver {
	constructor(private _gitVersionControl: GitVersionControl, private _fp: FileProvider, private _pathToRep: Path) {}

	async abortMerge(headBeforeMerge?: GitVersion): Promise<void> {
		if (headBeforeMerge) await this._gitVersionControl.softReset(headBeforeMerge);
		await this._gitVersionControl.hardReset();
	}

	async getFilesToMerge(fs?: FileStructure): Promise<MergeFile[]> {
		const changeFiles = await this._gitVersionControl.getChanges(false);
		return Promise.all(
			changeFiles.map(async (file) => {
				const content = await this._fp.read(this._pathToRep.join(file.path));
				const path = file.path.value;
				const title: string = fs ? fs.parseMarkdown(content).props.title ?? "" : null;
				const entry = { content, path, title, type: file.type };

				if (content?.match(FIND_MERGE_CONFLICT)) return entry;

				if (file.type != FileStatus.conflict) return;

				let exists = true;
				try {
					exists = !!(await this._gitVersionControl.showLastCommitContent(file.path));
				} catch {
					exists = false;
				}

				entry.type = exists ? FileStatus.delete : FileStatus.new;
				return entry;
			}),
		).then((x) => x.filter((x) => x));
	}

	async resolveConflictedFiles(files: MergeFile[]): Promise<void> {
		await Promise.all(
			files.map(async (file) => {
				if (file.content) await this._fp.write(this._pathToRep.join(new Path(file.path)), file.content);
				else await this._fp.delete(this._pathToRep.join(new Path(file.path)));
				await this._gitVersionControl.restore(true, [new Path(file.path)]);
			}),
		);
	}
}
