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
			avatarUrl: this._fixAvatarUrl(data.avatar_url),
		};
	}

	// temp, wait for GitVerse to fix avatar url
	private _fixAvatarUrl(url: string) {
		const hash = url.split("/").pop();
		return `https://gitverse.ru/sc/avatars/${hash}`;
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		try {
			const repData = await (await this._api(`user/repos/${data.group}/${data.name}`)).json();
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
							lastActivity: g.updatedAt,
						}),
					),
			),
		).then((x) => x.flat());
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getPageProjects(fromPage: number, toPage: number, _perPage?: number): Promise<GitRepsPageData[]> {
		// temp perPage, because GitVerse don't implement total pages. We show first 1000 reps.
		const perPage = 1000;

		const responses = await this._paginationFromTo(`user/repos`, fromPage, toPage, perPage);

		return Promise.all(
			responses.map(async (res): Promise<GitRepsPageData> => {
				return {
					repDatas: (await res.json())
						.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
						.map((p): GitRepData => ({ path: p.full_name, lastActivity: p.updated_at })),
					page: 1, // temp hardcode 1
					totalPages: 1, // temp hardcode 1
					totalPathsCount: undefined,
				};
			}),
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getBranchWithFile(filename: string, data: StorageData): Promise<string> {
		throw new Error("Method not implemented in GitVerse.");
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

	// temp implementation, because GitVerse don't implement total pages.
	protected async _paginationApi(
		url: string,
		init?: RequestInit,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_perPage = this._defaultPerPage,
	): Promise<Response[]> {
		const result: Response[] = [];
		const perPage = 1000;

		let isEmpty = false;
		let page = 1;
		let count = 0;

		while (!isEmpty) {
			count++;
			if (count > 100) break;

			const res = await this._paginationFromTo(url, page, page, perPage)[0];
			const length = (await res.clone().json())?.length;
			if (!length) isEmpty = true;
			else {
				result.push(...res);
				page++;
			}
		}

		return result;
	}
	protected _paginationFromTo(url: string, fromPage: number, toPage: number, perPage: number): Promise<Response[]> {
		this._validatePages(fromPage, toPage);

		const resPromises: Promise<Response>[] = [];
		for (let page = fromPage; page < toPage + 1; page++) {
			const res = this._api(`${url}${this._getConcatChar(url)}${perPage ? `limit=${perPage}&` : ""}page=${page}`);
			resPromises.push(res);
		}

		return Promise.all(resPromises);
	}

	protected async _api(url: string, init?: RequestInit): Promise<Response> {
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
