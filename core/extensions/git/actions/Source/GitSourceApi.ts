import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type Branch from "@ext/VersionControl/model/branch/Branch";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import type { SourceAPI, SourceUser } from "@ext/git/actions/Source/SourceAPI";
import { GitRepData, GitRepsPageData } from "@ext/git/actions/Source/model/GitRepsApiData";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import CatalogExistsError from "@ext/storage/models/CatalogExistsError";
import type StorageData from "@ext/storage/models/StorageData";

abstract class GitSourceApi implements SourceAPI {
	protected readonly _defaultPerPage = 100;
	constructor(protected _data: GitSourceData, protected _onError?: (error: NetworkApiError) => void) {}

	get defaultPerPage() {
		return this._defaultPerPage;
	}

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

	async assertStorageExist(data: StorageData): Promise<void> {
		if (await this.isRepositoryExists(data)) {
			throw new CatalogExistsError(
				(data as GitStorageData).source.domain + "/" + (data as GitStorageData).group,
				data.name,
			);
		}
	}

	async isCredentialsValid(): Promise<boolean> {
		try {
			await this.getUser();
		} catch (e) {
			if (e instanceof NetworkApiError && (e.props.status == 401 || e.props.status == 403)) {
				return false;
			}
			console.error(e);
		}
		return true;
	}

	abstract refreshAccessToken(): Promise<GitSourceData>;
	abstract getUser(): Promise<SourceUser>;
	abstract isRepositoryExists(data: StorageData): Promise<boolean>;
	abstract getAllProjects(): Promise<GitRepData[]>;
	abstract getPageProjects(fromPage: number, toPage: number, perPage?: number): Promise<GitRepsPageData[]>;

	abstract getBranchWithFile(filename: string, data: StorageData): Promise<string>;
	abstract isBranchContainsFile(filename: string, data: StorageData, branch: Branch): Promise<boolean>;
	abstract getDefaultBranch(data: StorageData): Promise<string>;
	abstract getAllBranches(data: StorageData, field?: string): Promise<string[]>;

	protected abstract _api(url: string, init?: RequestInit): Promise<Response>;
	protected abstract _paginationApi(url: string, init?: RequestInit, perPage?: number): Promise<Response[]>;
	protected abstract _paginationFromTo(
		url: string,
		fromPage: number,
		toPage: number,
		perPage: number,
	): Promise<Response[]>;

	protected _getConcatChar(url: string): string {
		return url.includes("?") ? "&" : "?";
	}

	protected _validatePages(from: number, to: number): void {
		if (from < 0 || to < 0) throw new Error("Value can't be less than zero");
		if (from > to) throw new Error(`"from" page can't be bigger that "to" page`);
	}

	protected async _validateResponse(res: Response): Promise<void> {
		if (res.ok) return;
		const errorJson = (await res.json()) as { message: string; status: string; documentation_url: string };
		const error = new NetworkApiError(
			errorJson.message,
			{
				url: res.url,
				errorJson,
				status: res.status,
			},
			t("git.error.source-api.title"),
		);
		this._onError?.(error);
		throw error;
	}
}

export default GitSourceApi;
