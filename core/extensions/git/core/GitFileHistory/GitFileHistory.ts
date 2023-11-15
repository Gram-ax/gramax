import GitRepositoryConfig from "@ext/git/core/GitRepository/model/GitRepositoryConfig";
import Path from "../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../logic/FileProvider/model/FileProvider";
import { Catalog } from "../../../../logic/FileStructue/Catalog/Catalog";
import { ItemRef } from "../../../../logic/FileStructue/Item/Item";
import { getDiff } from "../../../VersionControl/DiffHandler/DiffHandler";
import { VersionControlInfo } from "../../../VersionControl/model/VersionControlInfo";
import VersionControlType from "../../../VersionControl/model/VersionControlType";
import DefaultError from "../../../errorHandlers/logic/DefaultError";
import SourceType from "../../../storage/logic/SourceDataProvider/model/SourceType";
import { ArticleHistoryViewModel } from "../../actions/History/model/ArticleHistoryViewModel";
import { GitRepository } from "../GitRepository/GitRepository";
import GitVersionControl from "../GitVersionControl/GitVersionControl";

export default class GitFileHistory {
	private _versionControl: GitVersionControl;
	private _gitRepository: GitRepository;
	private _relativeFilePath: Path;
	private _filePath: Path;

	constructor(
		private _catalog: Catalog,
		private _fp: FileProvider,
		private _enterpriseServerUrl: string = "",
		private _conf: GitRepositoryConfig = { corsProxy: null },
		private _storageData?: { sourceType: SourceType; name: string; branch: string },
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
		if (this._storageData && this._storageData.sourceType == SourceType.enterprise) {
			const body = {
				filePath: this._filePath.value,
				repName: this._storageData.name,
				branch: this._storageData.branch,
			};
			const response = await fetch(`${this._enterpriseServerUrl}/review/filehistory`, {
				method: "POST",
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
			});
			if (!response.ok) throw new DefaultError((await response.json()).message);
			return await response.json();
		}

		const vc = (await this._catalog.getVersionControl()) as GitVersionControl;
		if (!vc || vc.getType() !== VersionControlType.git) return;
		({ versionControl: this._versionControl, relativePath: this._relativeFilePath } =
			await vc.getVersionControlContainsItem(this._filePath));

		this._gitRepository = new GitRepository(this._conf, this._fp, this._versionControl.getPath());
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
