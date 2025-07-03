import UserSettings, { EnterpriseWorkspaceConfig } from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import UserInfo from "@ext/security/logic/User/UserInfo";
import { RequestChunkModel } from "@ics/gx-ai/dist/styleGuideCheck/styleGuideGptRequest";
import { Suggestion } from "@ics/gx-ai/dist/styleGuideCheck/styleGuideGptResponse";

class EnterpriseApi {
	constructor(private _gesUrl: string) {}

	async check() {
		try {
			if (!this._gesUrl.includes("http")) return false;
			const res = await fetch(`${this._gesUrl}/enterprise/health-hwREfnmK`);
			return res.ok;
		} catch {
			return false;
		}
	}

	async getUser(token: string, checkSsoToken = false) {
		if (!this._gesUrl) return;

		try {
			const headers = {
				Authorization: `Bearer ${token ? token : "null"}`,
			};
			const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user?&checkSsoToken=${checkSsoToken}`, {
				headers,
			});
			if (!res.ok || res.status !== 200) {
				console.warn(`Error retrieving user information. Status: ${res.status} Status text: ${res.statusText}`);
				return;
			}

			const data = (await res.json()) as {
				info?: UserInfo;
				workspacePermissions?: string[];
				catalogsPermissions?: {
					resourceId: string;
					permissions: string[];
					props: { branches?: string[]; mainBranch: string };
				}[];
			};

			const catalogsPermissions = data.catalogsPermissions;
			const newCatalogsPermissions: { [catalogName: string]: string[] } = {};
			const newCatalogsProps: { [catalogName: string]: { branches?: string[]; mainBranch: string } } = {};
			catalogsPermissions.forEach(({ resourceId, permissions, props }) => {
				const split = resourceId.split("/");
				const catalogName = split.pop();
				if (!catalogName) return;
				newCatalogsPermissions[catalogName] = permissions;
				newCatalogsProps[catalogName] = props;
			});
			return { ...data, catalogsPermissions: newCatalogsPermissions, catalogsProps: newCatalogsProps };
		} catch (e) {
			console.log(e);
		}
	}

	async checkIsAdmin(token: string) {
		const headers = {
			Authorization: `Bearer ${token}`,
		};
		const url = `${this._gesUrl}/enterprise/config/check`;
		try {
			const res = await fetch(url, { headers });
			if (res.status === 200) return true;
			return false;
		} catch (e) {
			return false;
		}
	}

	async getUsers(search: string): Promise<{ name: string; email: string }[]> {
		if (!search || !search.trim()) return [];
		const res = await fetch(`${this._gesUrl}/sso/connectors/getUsers`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ emailOrCn: search }),
		});
		if (!res.ok) {
			console.error(await res.json());
			return [];
		}
		return res.json();
	}

	async isEnabledGetUsers(): Promise<boolean> {
		const res = await fetch(`${this._gesUrl}/sso/connectors/enabled`);
		return res.ok && res.status === 200;
	}

	async checkStyleGuide(paragraphs: RequestChunkModel[]): Promise<Suggestion[]> {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/style-guide/check`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(paragraphs),
			});
			return await res.json();
		} catch (e) {
			console.log(e);
		}
	}

	async healthcheckStyleGuide() {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/style-guide/health`);
			return res.ok;
		} catch (e) {
			return false;
		}
	}

	async initStorage(token: string, resourceId: string) {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/config/init-repo`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ resourceId }),
			});
			if (res.status == 403) throw new DefaultError(t("enterprise.init-repo.forbidden"));
			if (res.status == 409) throw new DefaultError(t("enterprise.init-repo.already-exists"));

			const resProxy = await fetch(`${this._gesUrl}/update`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.status == 403) throw new DefaultError(t("enterprise.init-repo.forbidden"));

			return res.ok && resProxy.ok;
		} catch (e) {
			if (e instanceof DefaultError) throw e;
			throw new DefaultError(t("enterprise.init-repo.error"), e, { showCause: true });
		}
	}

	async getUserSettings(token: string): Promise<UserSettings> {
		if (!this._gesUrl || !token) return;

		const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user-settings`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok || res.status !== 200) return;

		return await res.json();
	}

	async addReviews(token: string, resourceId: string, reviewers: string[], branch: string) {
		if (!this._gesUrl || !token) return;

		const res = await fetch(`${this._gesUrl}/enterprise/config/add-reviews`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ resourceId, reviewers, branch }),
		});

		if (res.status === 403) throw new DefaultError(t("enterprise.add-reviews.forbidden"));
		if (res.status === 400) throw new DefaultError(t("enterprise.add-reviews.not-found"));

		const gitRes = await fetch(`${this._gesUrl}/update`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		return gitRes.ok && res.ok && res.status === 200;
	}

	async getWorkspaceConfig(configHash?: string): Promise<EnterpriseWorkspaceConfig> {
		if (!this._gesUrl) return;

		try {
			const url = new URL(`${this._gesUrl}/enterprise/config/get-workspace-config`);
			if (configHash) {
				url.searchParams.append("hash", configHash);
			}

			const res = await fetch(url.toString());

			if (!res.ok || res.status !== 200) return;

			return await res.json();
		} catch (e) {
			console.error("Failed to get workspace config:", e);
			return;
		}
	}

	async mailSendOTP(email: string): Promise<{ status: number; timeLeft?: number }> {
		const res = await fetch(`${this._gesUrl}/enterprise/mail/send-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});

		if (res.status === 429) return { status: res.status, timeLeft: (await res.json())?.timeLeft };

		return { status: res.status };
	}

	async mailLoginOTP(email: string, otp: string) {
		const res = await fetch(`${this._gesUrl}/enterprise/mail/login-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, otp }),
		});

		if (!res.ok) return;

		return await res.json();
	}
}

export default EnterpriseApi;
