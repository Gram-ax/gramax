import Path from "../../../../logic/FileProvider/Path/Path";
import { FileStatus } from "../../../Watchers/model/FileStatus";
import StatusResult from "../GitRepository/model/StatusResult";
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
					type: FileStatus.new,
					isUntracked,
				});
			}
			const cht = split[0];
			let type: FileStatus = FileStatus.modified;
			if (cht == "D" || cht[0] == "R") type = FileStatus.delete;
			if (cht == "A") type = FileStatus.new;
			changeFiles.push({
				path: new Path(split[1]),
				type: type,
				isUntracked,
			});
		});
		return changeFiles;
	}

	getStatusChanges(statusResults: StatusResult[], submodulePaths: Path[]): GitStatus[] {
		const statusMapping: { [filePath: string]: { type: FileStatus; isUntracked: boolean } } = {
			"003": { type: FileStatus.delete, isUntracked: true }, // added, staged, deleted unstaged
			"020": { type: FileStatus.new, isUntracked: true }, // added, unstaged
			"022": { type: FileStatus.new, isUntracked: false }, // added, staged
			"023": { type: FileStatus.conflict, isUntracked: true }, // added, staged, with unstaged changes
			"100": { type: FileStatus.delete, isUntracked: false }, // deleted, staged
			"101": { type: FileStatus.delete, isUntracked: true }, // deleted, unstaged
			"103": { type: FileStatus.delete, isUntracked: true }, // deleted unstaged, modified staged
			"110": { type: FileStatus.current, isUntracked: false }, // not-modified, deleted unstaged
			"111": null, // unmodified
			"113": { type: FileStatus.conflict, isUntracked: false }, // not-modified unstaged, modified staged
			"120": { type: FileStatus.modified, isUntracked: false }, // modified staged, delete unstaged
			"121": { type: FileStatus.modified, isUntracked: true }, // modified, unstaged
			"122": { type: FileStatus.modified, isUntracked: false }, // modified, staged
			"123": { type: FileStatus.modified, isUntracked: true }, // modified, staged, with unstaged changes
		};

		return statusResults
			.map((result) => {
				const statusPath = result.shift() as string;
				for (const submodulePath of submodulePaths) if (statusPath.startsWith(submodulePath.value)) return;
				const status = result.join("");
				if (!statusMapping[status]) return;

				return {
					path: new Path(statusPath),
					...statusMapping[status],
				};
			})
			.filter((x) => x);
	}

	getGitLabLink(splitRepositoryUrl: string[], currentBranch: string, storageName: string, filePath: Path): string {
		const gitLabUrl = splitRepositoryUrl.slice(0, 3).join("/");
		const project = splitRepositoryUrl[3];

		return `${gitLabUrl}/-/ide/project/${project}/${storageName}/blob/${currentBranch}/-/${filePath}`
			.replace(/\/\//g, "/")
			.replace(":/", "://");
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
