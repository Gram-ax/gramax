import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import GiteaSourceData from "@ext/git/actions/Source/Gitea/logic/GiteaSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { GitRepData, GitRepsPageData } from "@ext/git/actions/Source/model/GitRepsApiData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import assert from "assert";

export default class GiteaSourceAPI extends GitSourceApi {
	constructor(
		data: GiteaSourceData,
		private _authServiceUrl: string,
		protected _onError?: (error: NetworkApiError) => void,
	) {
		// default is 1000 because Gitea don't support sort by date in pagination API
		// so we need to get all projects at once (or at least first 1000)
		const defaultPerPage = 1000;
		super(data, _onError, defaultPerPage);
	}

	async refreshAccessToken(): Promise<GitSourceData> {
		assert(this._authServiceUrl, "authServiceUrl is required");

		const url = `${this._authServiceUrl}/gitea-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		return (await res.json()) ?? null;
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api(`user`);
		const user = await res.json();
		const name = (user.full_name as string)?.trim?.()?.length ? user.full_name : user.username;

		return { name, email: user.email, username: user.username, avatarUrl: user.avatar_url };
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		try {
			const res = await this._api(`repos/${data.group}/${data.name}`);
			if (await res.json().then((j) => j.id)) return true;
			return false;
		} catch (e) {
			if (e instanceof NetworkApiError && e.props.status === 404) return false;
			throw e;
		}
	}

	async getAllProjects(): Promise<GitRepData[]> {
		const responses = await this._paginationApi(`user/repos`);
		return (await Promise.all(responses.map(async (res) => await res.json()))).flat().map((project) => ({
			path: project.full_name,
			lastActivity: project.updated_at,
		}));
	}

	async getPageProjects(fromPage: number, toPage: number, perPage?: number): Promise<GitRepsPageData[]> {
		const responses = await this._paginationFromTo("user/repos", fromPage, toPage, perPage);

		return Promise.all(
			responses.map(async (res, idx): Promise<GitRepsPageData> => {
				const totalPathsCount = parseInt(res.headers.get("x-total-count"));
				return {
					repDatas: (await res.json()).map(
						(p): GitRepData => ({ path: p.full_name, lastActivity: p.updated_at }),
					),
					page: fromPage + idx,
					totalPages: Math.ceil(totalPathsCount / perPage),
					totalPathsCount,
				};
			}),
		);
	}

	async getBranchWithFile(filename: string, data: GitStorageData): Promise<string> {
		const branches = await this.getAllBranches(data);
		for (const branch of branches) {
			const containsFile = await this.isBranchContainsFile(filename, data, branch);
			if (containsFile) return branch;
		}
		return null;
	}
	async isBranchContainsFile(filename: string, data: GitStorageData, branch: string): Promise<boolean> {
		const res = await this._api(
			`repos/${data.group}/${data.name}/contents/${encodeURIComponent(filename)}?ref=${branch}`,
		);
		return res.status === 200;
	}
	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const res = await this._api(`repos/${data.group}/${data.name}`);
		return (await res.json()).default_branch;
	}

	async getAllBranches(data: GitStorageData, field?: string): Promise<string[]> {
		const res = await this._api(`repos/${data.group}/${data.name}/branches`);
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	async createRepository(data: GitStorageData): Promise<void> {
		await this._api(`user/repos`, {
			method: "POST",
			body: JSON.stringify({ name: data.name, private: true }),
			headers: { "Content-Type": "application/json" },
		});
	}

	protected async _api(url: string, init?: RequestInit): Promise<Response> {
		await this._assertHasInternetAccess();
		const sourceUrl = `${this._data.protocol ?? "https"}://${this._data.domain}`;
		try {
			const res = await fetch(`${sourceUrl}/api/v1/${url}`, {
				...init,
				headers: {
					...(init?.headers ?? {}),
					...(this._data.token && { Authorization: `Bearer ${this._data.token}` }),
				},
			});

			await this._validateResponse(res);
			return res;
		} catch (e) {
			if (e instanceof NetworkApiError) throw e;
			await this._validateResponse(null);
		}
	}

	protected async _paginationApi(
		url: string,
		init?: RequestInit,
		perPage = this._defaultPerPage,
	): Promise<Response[]> {
		const result: Response[] = [];
		const concatChar = this._getConcatChar(url);
		const res = await this._api(`${url}${perPage ? `${concatChar}limit=${perPage}` : ""}`, init);

		result.push(res);

		const responseTotalPages = parseInt(res.headers.get("x-total-count"));
		if (responseTotalPages < 2) return result;

		result.push(...(await this._paginationFromTo(url, 2, responseTotalPages, perPage)));

		return result;
	}

	protected async _paginationFromTo(
		url: string,
		fromPage: number,
		toPage: number,
		perPage: number,
	): Promise<Response[]> {
		this._validatePages(fromPage, toPage);

		const resPromises: Promise<Response>[] = [];
		for (let page = fromPage; page < toPage + 1; page++) {
			const res = this._api(`${url}${this._getConcatChar(url)}${perPage ? `limit=${perPage}&` : ""}page=${page}`);
			resPromises.push(res);
		}

		return Promise.all(resPromises);
	}
}
