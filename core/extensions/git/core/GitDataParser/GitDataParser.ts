import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import git from "isomorphic-git";
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

	getFileStatus(status: Awaited<ReturnType<typeof git.status>>, filePath: Path): GitStatus {
		const fileStatusMapping = new Map<
			Awaited<ReturnType<typeof git.status>>,
			{ type: FileStatus; isUntracked: boolean }
		>([
			["ignored", null],
			["unmodified", { type: FileStatus.current, isUntracked: null }],
			["*modified", { type: FileStatus.modified, isUntracked: true }],
			["*deleted", { type: FileStatus.delete, isUntracked: true }],
			["*added", { type: FileStatus.new, isUntracked: true }],
			["absent", null], // ?
			["modified", { type: FileStatus.modified, isUntracked: false }],
			["deleted", { type: FileStatus.delete, isUntracked: false }],
			["added", { type: FileStatus.new, isUntracked: false }],
			["*unmodified", { type: FileStatus.new, isUntracked: true }], // complex value
			["*absent", { type: FileStatus.delete, isUntracked: false }], // complex value
			["*undeleted", { type: FileStatus.delete, isUntracked: true }], // complex value
			["*undeletemodified", { type: FileStatus.modified, isUntracked: true }], // complex value
		]);
		const fileStatus = fileStatusMapping.get(status);
		if (!fileStatus) return;
		const { type, isUntracked } = fileStatus;
		return { path: filePath, type, isUntracked };
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
