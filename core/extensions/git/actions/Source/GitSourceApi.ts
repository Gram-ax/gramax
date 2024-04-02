import FetchService from "@core-ui/ApiServices/FetchService";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import type Branch from "@ext/VersionControl/model/branch/Branch";
import type { SourceAPI, SourceUser } from "@ext/git/actions/Source/SourceAPI";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import type StorageData from "@ext/storage/models/StorageData";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";

abstract class GitSourceApi implements SourceAPI {
	constructor(protected _data: GitSourceData) {}

	async removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string> {
		if (await this.isCredentialsValid()) return null;
		const removeSourceName = getStorageNameByData(this._data);

		if (!this._isRefreshableSource(this._data)) return removeSourceName;
		const newSourceData = await this.refreshAccessToken();
		if (!newSourceData?.token) return removeSourceName;

		await FetchService.fetch(apiUrlCreator.setSourceData(), JSON.stringify(newSourceData), MimeTypes.json);
		return null;
	}

	private _isRefreshableSource(data: GitSourceData): boolean {
		return !!data?.refreshToken;
	}

	abstract refreshAccessToken(): Promise<GitSourceData>;
	abstract isCredentialsValid(): Promise<boolean>;
	abstract getUser(): Promise<SourceUser>;
	abstract isRepositoryExists(data: StorageData): Promise<boolean>;
	abstract getAllProjects(): Promise<string[]>;

	abstract getBranchWithFile(filename: string, data: StorageData): Promise<string>;
	abstract isBranchContainsFile(filename: string, data: StorageData, branch: Branch): Promise<boolean>;
	abstract getDefaultBranch(data: StorageData): Promise<string>;
	abstract getAllBranches(data: StorageData, field?: string): Promise<string[]>;
}

export default GitSourceApi;
