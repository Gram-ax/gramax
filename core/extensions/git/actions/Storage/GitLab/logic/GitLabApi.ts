import Branch from "../../../../../VersionControl/model/branch/Branch";
import { GitBranch } from "../../../../core/GitBranch/GitBranch";
import GitStorageData from "../../../../core/model/GitStorageData";
class GitLabApi {
	constructor(private _data: { domain: string; token: string }) {}

	async tokenIsWorking() {
		try {
			const res = await this._api(`user`);
			if (res.status == 401 || res.status == 403) return false;
		} catch {
			/* empty */
		}
		return true;
	}

	async getUserData(): Promise<{ name: string; email: string; username: string }> {
		const res = await this._api(`user`);
		if (res.ok) {
			const user = await res.json();
			return { name: user.name, email: user.email, username: user.username };
		}
		return null;
	}

	async getProjects(group: string, field = "name"): Promise<string[]> {
		const user = await this.getUserData();
		const url = `${user.username == group ? "users" : "groups"}/${group}/projects`;
		return await Promise.all(
			(await this._paginationApi(url)).map(async (res) => (await res.json()).map((g) => g[field])),
		).then((x) => x.flat());
	}

	async getAllProjects() {
		const projects: string[][] = await Promise.all(
			(await this.getGroups()).map(async (g) => await this.getProjects(g, "path_with_namespace")),
		);
		return Array.from(new Set(projects.flat()));
	}

	async getGroups(): Promise<string[]> {
		const groups: string[][] = [];
		const user = await this.getUserData();
		if (user) groups.push([user.username]);
		groups.push(
			...(await Promise.all(
				(await this._paginationApi("groups")).map(
					async (res): Promise<string[]> => (await res.json()).map((g) => g.path),
				),
			)),
		);
		return groups.flat();
	}

	async getBranchСontainsFile(fileName: string, data: GitStorageData): Promise<string> {
		const defaultBranch = await this.getDefaultBranch(data);
		const branches = [defaultBranch, ...(await this.getBranches(data)).filter((b) => b != defaultBranch)];
		for (const branch of branches) {
			const search = await this._searchFileInBranch(fileName, data, branch);
			if (!search || !search.length) continue;
			return search[0].ref;
		}
		return null;
	}

	async existFileInBranch(fileName: string, data: GitStorageData, branch: GitBranch): Promise<boolean> {
		const search = await this._searchFileInBranch(fileName, data, branch);
		if (!search || !search.length) false;
		return !!search[0]?.ref;
	}

	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}`);
		if (!res.ok) return null;
		return (await res.json()).default_branch;
	}

	async getBranches(data: GitStorageData, field?: string): Promise<any[]> {
		const res = await this._api(`projects/${encodeURIComponent(`${data.group}/${data.name}`)}/repository/branches`);
		if (!res.ok) return [];
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	private async _searchFileInBranch(
		fileName: string,
		data: GitStorageData,
		branch: Branch,
	): Promise<{ ref: string }[]> {
		const id = encodeURIComponent(`${data.group}/${data.name}`);
		const url = `projects/${id}/search?scope=blobs&search=${fileName}&ref=${branch.toString()}`;
		const response = await this._api(url);
		if (!response.ok) return [];
		const search = await response.json();
		if (!search || !search.length) return [];
		return search;
	}

	private async _paginationApi(url: string, init?: RequestInit, perPage = 20): Promise<Response[]> {
		const result: Response[] = [];
		const res = await this._api(`${url}?per_page=${perPage}`, init);
		if (!res.ok) return [];
		result.push(res);
		const responseTotalPages = parseInt(res.headers.get("x-total-pages"));
		if (responseTotalPages > 1) {
			result.push(
				...(await Promise.all(
					Array.from([...Array(responseTotalPages - 1).keys()]).map(async (page): Promise<Response> => {
						const res = await this._api(`${url}?per_page=${perPage}&page=${page + 2}`);
						if (!res.ok) return null;
						return res;
					}),
				).then((x) => x.filter((x) => x))),
			);
		}

		return result;
	}

	private async _api(url: string, init?: RequestInit): Promise<Response> {
		const res = await fetch(`https://${this._data.domain}/api/v4/${url}`, {
			...init,
			headers: { ...(init?.headers ?? {}), "PRIVATE-TOKEN": this._data.token },
		});
		return res;
	}
}

export default GitLabApi;
