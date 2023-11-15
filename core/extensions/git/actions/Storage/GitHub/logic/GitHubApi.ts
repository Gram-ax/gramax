import OAuth2URL from "@core/utils/OAuth2URL";
import Branch from "../../../../../VersionControl/model/branch/Branch";
import { GitBranch } from "../../../../core/GitBranch/GitBranch";
import GitStorageData from "../../../../core/model/GitStorageData";

class GitHubApi {
	constructor(private _accessToken: string) {}

	async tokenIsWorking(): Promise<boolean> {
		try {
			const res = await this._api(`user`);
			if (res.status == 401 || res.status == 403) return false;
		} catch {
			/* empty */
		}
		return true;
	}

	async getUserData() {
		const res = await this._api("user");
		if (!res.ok) return null;
		const user = await res.json();
		return {
			name: user.login as string,
			email: await this._getUserMail(),
			avatarUrl: user.avatar_url as string,
		};
	}

	async getAllProjects(): Promise<string[]> {
		const res = await this._api("user/repos", { method: "GET" });
		if (!res.ok) return [];
		const projects = await res.json();
		return projects.map((project) => project.full_name);
	}

	async getBranchСontainsFile(fileName: string, data: GitStorageData): Promise<string> {
		const defaultBranch = await this.getDefaultBranch(data);
		const branches = [defaultBranch, ...(await this.getBranches(data)).filter((b) => b != defaultBranch)];
		for (const branch of branches) {
			const existEileInBranch = await this.existFileInBranch(fileName, data, branch);
			if (existEileInBranch) return branch;
		}
		return null;
	}

	async existFileInBranch(fileName: string, data: GitStorageData, branch: GitBranch): Promise<boolean> {
		const paths: string[] = await this.getFileTree(data, branch);
		return !!paths.find((path) => path.includes(fileName));
	}

	async getDefaultBranch(data: GitStorageData): Promise<string> {
		const res = await this._api(`repos/${data.group}/${data.name}`);
		if (!res.ok) return null;
		return (await res.json()).default_branch;
	}

	async getBranches(data: GitStorageData, field?: string): Promise<any[]> {
		const res = await this._api(`repos/${data.group}/${data.name}/branches`);
		if (!res.ok) return [];
		return (await res.json()).map((branch) => branch?.[field] ?? branch?.name);
	}

	async getFileTree(data: GitStorageData, branch: Branch, field?: string): Promise<any[]> {
		const res = await this._api(`repos/${data.group}/${data.name}/git/trees/${branch.toString()}?recursive=1`);
		if (!res.ok) return [];
		return (await res.json()).tree.map((file) => file?.[field] ?? file?.path);
	}

	async getInstallations() {
		const res = await this._api("user/installations");
		if (!res.ok) return null;
		const installations = await res.json();
		return installations.installations.map((i) => ({
			name: i.account.login,
			htmlUrl: i.account.html_url,
			avatarUrl: i.account.avatar_url,
		}));
	}

	async refreshAccessToken(refreshToken: string): Promise<string> {
		const url = `${OAuth2URL}/github-refresh?refreshToken=${refreshToken}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		return (await res?.text()) ?? null;
	}

	private async _getUserMail(): Promise<string> {
		const res = await this._api("user/emails");
		if (!res.ok) return null;
		const mails = (await res.json()) as any[];
		return mails.find((mail) => mail.primary).email ?? mails[0].email;
	}

	private async _api(url: string, init?: RequestInit): Promise<Response> {
		const res = await fetch(`https://api.github.com/${url}`, {
			...init,
			headers: { ...(init?.headers ?? {}), Authorization: `token ${this._accessToken}` },
		});
		return res;
	}
}

export default GitHubApi;
