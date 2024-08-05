import type GitlabSourceData from "@ext/git/actions/Source/GitLab/logic/GitlabSourceData";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import Branch from "../../../../../VersionControl/model/branch/Branch";
import GitStorageData from "../../../../core/model/GitStorageData";

export default class GitlabSourceAPI extends GitSourceApi {
	constructor(data: GitlabSourceData, private _authServiceUrl: string) {
		super(data);
	}

	async isCredentialsValid() {
		try {
			const res = await this._api(`user`);
			if ((res && res.status == 401) || res.status == 403) return false;
		} catch {}
		return true;
	}

	async refreshAccessToken(): Promise<GitSourceData> {
		const url = `${this._authServiceUrl}/gitlab-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		if (!res?.ok) return null;
		return (await res.json()) ?? null;
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}`, { method: "GET" });
		if (res && res.ok && (await res.json().then((j) => j.id))) return true;
		return false;
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api(`user`);
		if (res && !res.ok) return null;
		const user = await res.json();
		return { name: user.name, email: user.email, username: user.username, avatarUrl: user.avatar_url };
	}

	async getProjectsByGroup(group: string, field = "name"): Promise<string[]> {
		const user = await this.getUser();
		const url = `${user.username == group ? "users" : "groups"}/${group}/projects`;
		return await Promise.all(
			(await this._paginationApi(url)).map(async (res) => (await res.json()).map((g) => g[field])),
		).then((x) => x.flat());
	}

	async getAllProjects() {
		const projects: string[][] = await Promise.all(
			(await this.getAllGroups()).map(async (g) => await this.getProjectsByGroup(g, "path_with_namespace")),
		);
		return Array.from(new Set(projects.flat()));
	}

	async getAllGroups(): Promise<string[]> {
		const groups: string[][] = [];
		const user = await this.getUser();
		if (user) groups.push([user.username]);
		groups.push(
			...(await Promise.all(
				(
					await this._paginationApi("groups")
				).map(async (res): Promise<string[]> => (await res.json()).map((g) => g.path)),
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
		if (res && !res.ok) return null;
		return (await res.json()).default_branch;
	}

	async getAllBranches(data: GitStorageData, field?: string): Promise<any[]> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}/repository/branches`);
		if (res && !res.ok) return [];
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
		if (res && !res.ok) return [];
		const search = await res.json();
		if (!search || !search.length) return [];
		return search;
	}

	private async _paginationApi(url: string, init?: RequestInit, perPage?: number): Promise<Response[]> {
		const result: Response[] = [];
		const res = await this._api(`${url}${perPage ? `?per_page=${perPage}` : ""}`, init);
		if (res && !res.ok) return [];
		result.push(res);
		const responseTotalPages = parseInt(res.headers.get("x-total-pages"));
		if (responseTotalPages > 1) {
			const responses = await Promise.all(
				Array.from([...Array(responseTotalPages - 1).keys()]).map(async (page): Promise<Response> => {
					const res = await this._api(`${url}?${perPage ? `per_page=${perPage}&` : ""}page=${page + 2}`);
					if (res && !res.ok) return null;
					return res;
				}),
			);
			result.push(...responses.filter((x) => x));
		}

		return result;
	}

	private async _api(url: string, init?: RequestInit): Promise<Response> {
		try {
			const res = await fetch(`${this._data.protocol ?? "https"}://${this._data.domain}/api/v4/${url}`, {
				...init,
				headers: {
					...(init?.headers ?? {}),
					...(this._data.token && { Authorization: `Bearer ${this._data.token}` }),
				},
			});
			return res;
		} catch (e) {
			console.error(e);
		}
	}
}
