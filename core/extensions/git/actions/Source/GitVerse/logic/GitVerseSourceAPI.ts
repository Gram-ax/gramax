/* eslint-disable @typescript-eslint/no-unused-vars */
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import GitVerseSourceData from "@ext/git/actions/Source/GitVerse/logic/GitVerseSourceData";
import { GitRepData, GitRepsPageData } from "@ext/git/actions/Source/model/GitRepsApiData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import GitStorageData from "@ext/git/core/model/GitStorageData";
import StorageData from "@ext/storage/models/StorageData";
import assert from "assert";

export default class GitVerseSourceAPI extends GitSourceApi {
	protected _defaultPerPage = 50; // maximum in GitVerse API

	constructor(
		data: GitVerseSourceData,
		private _authServiceUrl: string,
		protected _onError?: (error: NetworkApiError) => void,
	) {
		super(data, _onError);
	}

	async refreshAccessToken(): Promise<GitSourceData> {
		assert(this._authServiceUrl, "authServiceUrl is required");

		const url = `${this._authServiceUrl}/gitverse-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		return (await res.json()) ?? null;
	}

	async getUser(): Promise<SourceUser> {
		const data = await (await this._api("user")).json();
		const name = (data.name as string)?.trim?.()?.length ? data.name : data.login;
		return {
			name,
			username: data.login,
			email: data.email,
			avatarUrl: data.avatar_url,
		};
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		try {
			const repData = await (await this._api(`repos/${data.group}/${data.name}`)).json();
			return !!repData.id;
		} catch (e) {
			if (e instanceof NetworkApiError && e.props.status === 404) return false;
			throw e;
		}
	}

	async getAllProjects(): Promise<GitRepData[]> {
		return Promise.all(
			(await this._paginationApi("user/repos")).map(
				async (res): Promise<GitRepData[]> =>
					(await res.json()).map(
						(g): GitRepData => ({
							path: g.full_name,
							lastActivity: g.updated_at,
						}),
					),
			),
		).then((x) => x.flat().sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()));
	}

	// make everything in one page, because GitVerse API don't have info about total pages
	async getPageProjects(
		fromPage: number,
		toPage: number,
		perPage = this._defaultPerPage,
	): Promise<GitRepsPageData[]> {
		const repDatas = await this.getAllProjects();
		return [{ repDatas, page: 1, totalPages: 1, totalPathsCount: repDatas.length }];
	}

	getBranchWithFile(filename: string, data: StorageData): Promise<string> {
		throw new Error("Method not implemented in GitVerse.");
	}

	isBranchContainsFile(filename: string, data: GitStorageData, branch: string): Promise<boolean> {
		throw new Error("Method not implemented in GitVerse.");
	}

	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const repData = await (await this._api(`user/repos/${data.group}/${data.name}`)).json();
		return repData?.default_branch;
	}

	async getAllBranches(data: GitStorageData, field?: string): Promise<string[]> {
		const res = await this._api(`user/repos/${data.group}/${data.name}/branches`);
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	async createRepository(data: GitStorageData): Promise<void> {
		await this._api(`user/repos`, {
			method: "POST",
			body: JSON.stringify({ name: data.name, private: true }),
			headers: { "Content-Type": "application/json" },
		});
	}

	// sync implementation, because GitVerse don't implement total pages.
	protected async _paginationApi(
		url: string,
		init?: RequestInit,
		perPage = this._defaultPerPage,
	): Promise<Response[]> {
		const result: Response[] = [];

		let isEmpty = false;
		let page = 1;
		let count = 0;

		while (!isEmpty) {
			count++;
			if (count > 100) break;

			const res = (await this._paginationFromTo(url, page, page, perPage))[0];
			const length = (await res.clone().json())?.length;
			if (!length) isEmpty = true;
			else {
				result.push(res);
				page++;
			}
		}

		return result;
	}
	protected _paginationFromTo(url: string, fromPage: number, toPage: number, perPage: number): Promise<Response[]> {
		this._validatePages(fromPage, toPage);

		const resPromises: Promise<Response>[] = [];
		for (let page = fromPage; page < toPage + 1; page++) {
			const res = this._api(
				`${url}${this._getConcatChar(url)}${perPage ? `per_page=${perPage}&` : ""}page=${page}`,
			);
			resPromises.push(res);
		}

		return Promise.all(resPromises);
	}

	protected async _api(url: string, init?: RequestInit): Promise<Response> {
		await this._assertHasInternetAccess();
		try {
			const res = await fetch(`https://api.gitverse.ru/${url}`, {
				...init,
				headers: {
					...(init?.headers ?? {}),
					...(this._data.token && {
						Accept: "application/vnd.gitverse.object+json;version=1",
						Authorization: `Bearer ${this._data.token}`,
					}),
				},
			});

			await this._validateResponse(res);
			return res;
		} catch (e) {
			if (e instanceof NetworkApiError) throw e;
			await this._validateResponse(null);
		}
	}
}
