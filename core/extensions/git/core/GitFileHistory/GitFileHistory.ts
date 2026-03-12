import type { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import type Path from "../../../../logic/FileProvider/Path/Path";
import type { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { getDiff } from "../../../VersionControl/DiffHandler/DiffHandler";
import type { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import type { ArticleHistoryViewModel } from "../../actions/History/model/ArticleHistoryViewModel";
import { GitCommands } from "../GitCommands/GitCommands";
import type GitVersionControl from "../GitVersionControl/GitVersionControl";

export default class GitFileHistory {
	private _versionControl: GitVersionControl;
	private _gitRepository: GitCommands;
	private _relativeFilePath: Path;
	private _filePath: Path;

	constructor(
		private _catalog: Catalog,
		private _fp: FileProvider,
	) {}

	async getArticleHistoryInfo(itemRef: ItemRef, offset = 0, limit = 15): Promise<ArticleHistoryViewModel[]> {
		this._filePath = this._catalog.getRepositoryRelativePath(itemRef);

		try {
			const getFileHistory = await this._getFileHistory(offset, limit);
			return this._versionControlDiffParser(getFileHistory);
		} catch {
			return [];
		}
	}

	private async _getFileHistory(offset = 0, limit = 15): Promise<VersionControlInfo[]> {
		const gvc = this._catalog.repo.gvc;
		if (!gvc) return;
		({ gitVersionControl: this._versionControl, relativePath: this._relativeFilePath } =
			await gvc.getVersionControlByPath(this._filePath));

		this._gitRepository = new GitCommands(this._fp, this._versionControl.getPath());
		return this._gitRepository.getFileHistory(this._relativeFilePath, offset, limit);
	}

	private _versionControlDiffParser(versionControlInfo: VersionControlInfo[]): ArticleHistoryViewModel[] {
		const articleHistoryViewModels: ArticleHistoryViewModel[] = versionControlInfo.map(
			(data): ArticleHistoryViewModel => {
				const diff = getDiff(data.parentContent ?? "", data.content ?? "").changes;
				const getPathDiff =
					data.parentPath?.value && !data.parentPath.compare(data.path)
						? getDiff(data.parentPath.value, data.path.value).changes
						: undefined;

				return {
					version: data.version,
					author: data.author,
					date: data.date,
					content: diff,
					filePath: {
						path: data.path.value,
						oldPath: data.parentPath?.value,
						diff: getPathDiff,
					},
				};
			},
		);

		return articleHistoryViewModels;
	}
}
