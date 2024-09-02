import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import Path from "../../../../logic/FileProvider/Path/Path";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import { GitStatus } from "../GitWatcher/model/GitStatus";

export class GitDataParser {
	getDiffChanges(gitDiff: string, isUntracked: boolean): GitStatus[] {
		const changes: string[] = this._getChanges(gitDiff);
		const changeFiles: GitStatus[] = [];
		changes.forEach((st) => {
			if (!st.length) return;
			const split = st.split("\t");
			if (split.length === 3) {
				changeFiles.push({
					path: new Path(split[2]),
					status: FileStatus.new,
					isUntracked,
				});
			}
			const cht = split[0];
			let type: FileStatus = FileStatus.modified;
			if (cht == "D" || cht[0] == "R") type = FileStatus.delete;
			if (cht == "A") type = FileStatus.new;
			changeFiles.push({
				path: new Path(split[1]),
				status: type,
				isUntracked,
			});
		});
		return changeFiles;
	}

	

	getEditFileLink(
		sourceName: string,
		group: string,
		repName: string,
		branch: string,
		filePath: Path,
		sourceType: SourceType,
	): string {
		const links: Record<SourceType, string> = {
			Git: "",
			Confluence: "",
			GitHub: `https://${sourceName}/${group}/${repName}/edit/${branch}/${filePath.value}`,
			GitLab: `https://${sourceName}/-/ide/project/${group}/${repName}/blob/${branch}/-/${filePath.value}`,
		};
		return links[sourceType];
	}

	private _getChanges(change: string): string[] {
		return change !== "" ? this._removeDirsFromChanges(change.split("\n").filter((x) => x)) : [];
	}

	private _removeDirsFromChanges(change: string[]): string[] {
		return change.filter((x) => !x.endsWith("/"));
	}
}

const gitDataParser = new GitDataParser();

export default gitDataParser;
