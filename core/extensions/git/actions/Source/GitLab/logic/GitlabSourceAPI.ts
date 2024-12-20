import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { GitRepData, GitRepsPageData } from "@ext/git/actions/Source/model/GitRepsApiData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import Branch from "../../../../../VersionControl/model/branch/Branch";
import GitStorageData from "../../../../core/model/GitStorageData";

export default class GitlabSourceAPI extends GitSourceApi {
	private readonly _allProjectsUrl = "projects?order_by=last_activity_at&simple=true&membership=true";
	constructor(
		data: GitlabSourceData,
		private _authServiceUrl: string,
		protected _onError?: (error: NetworkApiError) => void,
	) {
		super(data, _onError);
	}

	async refreshAccessToken(): Promise<GitSourceData> {
		const url = `${this._authServiceUrl}/gitlab-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		return (await res.json()) ?? null;
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		try {
			const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}`, {
				method: "GET",
			});
			if (await res.json().then((j) => j.id)) return true;
			return false;
		} catch (e) {
			if (e instanceof NetworkApiError && e.props.status === 404) return false;
			throw e;
		}
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api(`user`);
		const user = await res.json();
		return { name: user.name, email: user.email, username: user.username, avatarUrl: user.avatar_url };
	}

	async getProjectsByGroup(group: string, field = "name"): Promise<string[]> {
		const user = await this.getUser();
		const url = `${user.username == group ? "users" : "groups"}/${encodeURIComponent(group)}/projects`;
		return await Promise.all(
			(await this._paginationApi(url)).map(async (res) => (await res.json()).map((g) => g[field])),
		).then((x) => x.flat());
	}

	async getPageProjects(
		fromPage: number,
		toPage: number,
		perPage = this._defaultPerPage,
	): Promise<GitRepsPageData[]> {
		const responses = await this._paginationFromTo(this._allProjectsUrl, fromPage, toPage, perPage);

		return Promise.all(
			responses.map(async (res): Promise<GitRepsPageData> => {
				return {
					repDatas: (await res.json()).map(
						(p): GitRepData => ({ path: p.path_with_namespace, lastActivity: p.last_activity_at }),
					),
					page: parseInt(res.headers.get("x-page")),
					totalPages: parseInt(res.headers.get("x-total-pages")),
					totalPathsCount: parseInt(res.headers.get("x-total")),
				};
			}),
		);
	}

	async getAllProjects(): Promise<GitRepData[]> {
		const responses = await this._paginationApi(this._allProjectsUrl);
		return (await Promise.all(responses.map(async (res) => await res.json()))).flat().map((project) => ({
			path: project.path_with_namespace,
			lastActivity: project.last_activity_at,
		}));
	}

	async getAllGroups(): Promise<string[]> {
		const groups: string[][] = [];
		const user = await this.getUser();
		if (user) groups.push([user.username]);
		groups.push(
			...(await Promise.all(
				(
					await this._paginationApi("groups")
				).map(async (res): Promise<string[]> => (await res.json()).map((g) => g.full_path)),
			)),
		);
		return groups.flat();
	}

	async getBranchWithFile(fileName: string, data: GitStorageData): Promise<string> {
		const defaultBranch = await this.getDefaultBranch(data);
		const branches = [defaultBranch, ...(await this.getAllBranches(data)).filter((b) => b != defaultBranch)];
		for (const branch of branches) {
			const search = await this._searchFileInBranch(fileName, data, branch);
			if (!search || !search.length) continue;
			return search[0].ref;
		}
		return null;
	}

	async isBranchContainsFile(fileName: string, data: GitStorageData, branch: Branch): Promise<boolean> {
		const search = await this._searchFileInBranch(fileName, data, branch);
		if (!search || !search.length) false;
		return !!search[0]?.ref;
	}

	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}`);
		return (await res.json()).default_branch;
	}

	async getAllBranches(data: GitStorageData, field?: string): Promise<any[]> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}/repository/branches`);
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	private async _searchFileInBranch(
		fileName: string,
		data: GitStorageData,
		branch: Branch,
	): Promise<{ ref: string }[]> {
		const id = encodeURIComponent(`${data.group}/${data.name}`);
		const url = `projects/${id}/search?scope=blobs&search=${fileName}&ref=${branch.toString()}`;
		const res = await this._api(url);
		const search = await res.json();
		if (!search || !search.length) return [];
		return search;
	}

	protected async _paginationApi(
		url: string,
		init?: RequestInit,
		perPage = this._defaultPerPage,
	): Promise<Response[]> {
		const result: Response[] = [];
		const concatChar = this._getConcatChar(url);
		const res = await this._api(`${url}${perPage ? `${concatChar}per_page=${perPage}` : ""}`, init);

		result.push(res);

		const responseTotalPages = parseInt(res.headers.get("x-total-pages"));
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
			const res = this._api(
				`${url}${this._getConcatChar(url)}${perPage ? `per_page=${perPage}&` : ""}page=${page}`,
			);
			resPromises.push(res);
		}

		return Promise.all(resPromises);
	}

	protected async _api(url: string, init?: RequestInit): Promise<Response> {
		const isEnterprise = this._data.isEnterprise;
		const res = await fetch(
			`${this._data.protocol ?? "https"}://${this._data.domain}${isEnterprise ? "/api" : ""}/api/v4/${url}`,
			{
				...init,
				headers: {
					...(init?.headers ?? {}),
					...(this._data.token && { Authorization: `Bearer ${this._data.token}` }),
				},
			},
		);
		await this._validateResponse(res);
		return res;
	}
}
