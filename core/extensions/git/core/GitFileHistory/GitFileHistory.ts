import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { getDiff } from "../../../VersionControl/DiffHandler/DiffHandler";
import { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import { ArticleHistoryViewModel } from "../../actions/History/model/ArticleHistoryViewModel";
import { GitCommands } from "../GitCommands/GitCommands";
import GitVersionControl from "../GitVersionControl/GitVersionControl";

export default class GitFileHistory {
	private _versionControl: GitVersionControl;
	private _gitRepository: GitCommands;
	private _relativeFilePath: Path;
	private _filePath: Path;

	constructor(
		private _catalog: Catalog,
		private _fp: FileProvider,
	) {}

	async getArticleHistoryInfo(itemRef: ItemRef): Promise<ArticleHistoryViewModel[]> {
		this._filePath = this._catalog.getRelativeRepPath(itemRef);

		try {
			const getFileHistory = await this._getFileHistory();
			return this._versionControlDiffParser(getFileHistory);
		} catch {
			return [];
		}
	}

	private async _getFileHistory(): Promise<VersionControlInfo[]> {
		// if (this._storageData) {
		// 	const body = {
		// 		filePath: this._filePath.value,
		// 		repName: this._storageData.name,
		// 		branch: this._storageData.branch,
		// 	};
		// 	const response = await fetch(`${this._reviewServerUrl}/filehistory`, {
		// 		method: "POST",
		// 		body: JSON.stringify(body),
		// 		headers: { "Content-Type": "application/json" },
		// 	});
		// 	if (!response.ok) throw new DefaultError((await response.json()).message);
		// 	return await response.json();
		// }

		const gvc = this._catalog.repo.gvc;
		if (!gvc) return;
		({ gitVersionControl: this._versionControl, relativePath: this._relativeFilePath } =
			await gvc.getGitVersionControlContainsItem(this._filePath));

		this._gitRepository = new GitCommands(this._fp, this._versionControl.getPath());
		return this._gitRepository.getFileHistory(this._relativeFilePath);
	}

	private _versionControlDiffParser(versionControlInfo: VersionControlInfo[]): ArticleHistoryViewModel[] {
		if (versionControlInfo.length < 14) versionControlInfo.push({ version: "", author: "", date: "", content: "" });
		const articleHistoryViewModels: ArticleHistoryViewModel[] = versionControlInfo.map(
			(data, idx): ArticleHistoryViewModel => {
				if (idx == versionControlInfo.length - 1) return null;
				const diff = getDiff(data.parentContent ?? "", data.content ?? "").changes;
				return {
					version: data.version,
					author: data.author,
					date: data.date,
					content: diff,
				};
			},
		);
		articleHistoryViewModels.pop();
		return articleHistoryViewModels;
	}
}
