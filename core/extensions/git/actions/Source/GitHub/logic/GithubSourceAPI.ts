import type GitHubSourceData from "@ext/git/actions/Source/GitHub/logic/GitHubSourceData";
import GithubInstallation from "@ext/git/actions/Source/GitHub/model/GithubInstallation";
import GitSourceApi from "@ext/git/actions/Source/GitSourceApi";
import { GitRepData, GitRepsPageData } from "@ext/git/actions/Source/model/GitRepsApiData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import parseGithubLink from "@ext/git/actions/Storage/GitHub/logic/utils/getTotalPages";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import Branch from "../../../../../VersionControl/model/branch/Branch";
import GitStorageData from "../../../../core/model/GitStorageData";

export default class GithubSourceAPI extends GitSourceApi {
	private readonly _allProjectsUrl = "user/repos?sort=updated";

	constructor(data: GitHubSourceData, private _authServiceUrl: string) {
		super(data);
	}

	async isCredentialsValid(): Promise<boolean> {
		try {
			const res = await this._api(`user`);
			if (res.status == 401 || res.status == 403) return false;
		} catch {
			/* empty */
		}
		return true;
	}

	async isRepositoryExists(data: GitStorageData): Promise<boolean> {
		const res = await this._api(`repos/${data.group}/${data.name}`, { method: "GET" });
		if (await res.json().then((j) => j.id)) return true;
		return false;
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api("user");
		if (!res.ok) return null;
		const user = await res.json();
		return {
			name: user.login as string,
			email: await this._getUserMail(),
			username: user.login as string,
			avatarUrl: user.avatar_url as string,
		};
	}

	async getAllProjects(): Promise<GitRepData[]> {
		return Promise.all(
			(await this._paginationApi("user/repos", { method: "GET" }, 10)).map(
				async (res): Promise<GitRepData[]> =>
					(await res.json()).map((g): GitRepData => ({ path: g.full_name, lastActivity: g.updated_at })),
			),
		).then((x) => x.flat());
	}

	async getPageProjects(
		fromPage: number,
		toPage: number,
		perPage = this._defaultPerPage,
	): Promise<GitRepsPageData[]> {
		const responses = await this._paginationFromTo(this._allProjectsUrl, fromPage, toPage, perPage);
		return Promise.all(
			responses.map(async (res, idx): Promise<GitRepsPageData> => {
				const totalPages = parseGithubLink(res.headers.get("link"));
				return {
					repDatas: (await res.json()).map(
						(p): GitRepData => ({ path: p.full_name, lastActivity: p.updated_at }),
					),
					page: fromPage + idx,
					totalPages,
					totalPathsCount: undefined,
				};
			}),
		);
	}

	async getBranchWithFile(fileName: string, data: GitStorageData): Promise<string> {
		const defaultBranch = await this.getDefaultBranch(data);
		const branches = [defaultBranch, ...(await this.getAllBranches(data)).filter((b) => b != defaultBranch)];
		for (const branch of branches) {
			const existEileInBranch = await this.isBranchContainsFile(fileName, data, branch);
			if (existEileInBranch) return branch;
		}
		return null;
	}

	async isBranchContainsFile(fileName: string, data: GitStorageData, branch: Branch): Promise<boolean> {
		const paths: string[] = await this.getFileTree(data, branch);
		return !!paths.find((path) => path.includes(fileName));
	}

	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const res = await this._api(`repos/${data.group}/${data.name}`);
		if (!res.ok) return null;
		return (await res.json()).default_branch;
	}

	async getAllBranches(data: GitStorageData, field?: string): Promise<any[]> {
		const res = await this._api(`repos/${data.group}/${data.name}/branches`);
		if (!res.ok) return [];
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	async getFileTree(data: GitStorageData, branch: Branch, field?: string): Promise<any[]> {
		const res = await this._api(`repos/${data.group}/${data.name}/git/trees/${branch.toString()}?recursive=1`);
		if (!res.ok) return [];
		return (await res.json()).tree.map((file) => file?.[field] ?? file?.path);
	}

	async getInstallations(): Promise<GithubInstallation[]> {
		const res = await this._api("user/installations");
		if (!res.ok) return null;
		const installations = await res.json();
		return installations.installations.map(
			(i): GithubInstallation => ({
				name: i.account.login,
				htmlUrl: i.account.html_url,
				avatarUrl: i.account.avatar_url,
				type: i.account.type,
			}),
		);
	}

	async refreshAccessToken(): Promise<GitSourceData> {
		const url = `${this._authServiceUrl}/github-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		this._data.token = await res?.text();
		return this._data ?? null;
	}

	private async _getUserMail(): Promise<string> {
		const res = await this._api("user/emails");
		if (!res.ok) return null;
		const mails = (await res.json()) as any[];
		return mails.find((mail) => mail.primary).email ?? mails[0].email;
	}

	protected async _paginationApi(url: string, init?: RequestInit, perPage?: number): Promise<Response[]> {
		const result: Response[] = [];
		const concatChar = this._getConcatChar(url);
		const res = await this._api(`${url}${perPage ? `${concatChar}per_page=${perPage}` : ""}`, init);
		if (!res || !res.ok) return [];

		result.push(res);

		const responseTotalPages = parseGithubLink(res.headers.get("link"));
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

		return (await Promise.all(resPromises)).filter((res) => res && res.ok);
	}

	protected async _api(url: string, init?: RequestInit): Promise<Response> {
		const res = await fetch(`https://api.github.com/${url}`, {
			...init,
			headers: { ...(init?.headers ?? {}), Authorization: `token ${this._data.token}` },
		});
		if (res.headers.get("x-ratelimit-remaining") === "0") {
			console.error("Github request limit has been exceeded");
			return { ok: false } as any;
		}
		return res;
	}
}
