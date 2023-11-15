import { DOC_ROOT_FILENAME } from "../../../logic/FileStructue/FileStructure";
import Branch from "../../VersionControl/model/branch/Branch";
import DefaultError from "../../errorHandlers/logic/DefaultError";
import GitHubApi from "../../git/actions/Storage/GitHub/logic/GitHubApi";
import GitLabApi from "../../git/actions/Storage/GitLab/logic/GitLabApi";
import { GitBranch } from "../../git/core/GitBranch/GitBranch";
import GitSourceData from "../../git/core/model/GitSourceData.schema";
import StorageData from "../models/StorageData";
import SourceType from "./SourceDataProvider/model/SourceType";

export default class StorageСhecker {
	async getСorrectBranch(data: StorageData): Promise<string> {
		const api = this._getApi(data);
		if (!api) return null;
		const branch = await api.getBranchСontainsFile(DOC_ROOT_FILENAME, data);
		if (!branch) throw new DefaultError("Ни в одной ветке репозитория нет каталога. Создайте и опубликуйте его.");
		return branch;
	}

	async checkBranch(data: StorageData, branch: Branch) {
		const api = this._getApi(data);
		if (!this._checkBranch(branch, data)) return;
		if (!api) return;
		const isExist = await api.existFileInBranch(DOC_ROOT_FILENAME, data, branch);
		if (!isExist) throw new DefaultError(`В ветке ${branch.toString()} нет каталога.`);
	}

	private _getApi(data: StorageData) {
		const source: GitSourceData = data.source as GitSourceData;
		let api: {
			getBranchСontainsFile: (fileName: string, data: StorageData) => Promise<string>;
			existFileInBranch: (fileName: string, data: StorageData, branch: Branch) => Promise<boolean>;
		};
		if (data.source.sourceType == SourceType.gitHub) api = new GitHubApi(source.token);
		else if (data.source.sourceType == SourceType.gitLab) api = new GitLabApi(source);
		if (!api) return;
		return api;
	}

	private _checkBranch(branch: Branch, data: StorageData): boolean {
		if (data.source.sourceType == SourceType.gitHub || data.source.sourceType == SourceType.gitLab) {
			return !!(branch as GitBranch).getData().remoteName;
		}
		return true;
	}
}
