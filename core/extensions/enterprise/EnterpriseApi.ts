import { stripMarkup } from "@components/Atoms/RichText/parseRichText";
import type {
	QuizAnswerCreate,
	QuizTestCreate,
} from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import { EnterpriseErrorCode } from "@ext/enterprise/errors/getEnterpriseErrors";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import type { EnterpriseWorkspaceConfig } from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type UserInfo from "@ext/security/logic/User/UserInfo";
import type { CheckChunk, CheckSuggestion } from "@ics/gx-vector-search";
import type { AccessTokenItem } from "../enterpriseCommon/components/accessTokens/types/AccessTokensComponentTypes";
import { EnterpriseAuthResult } from "./types/EnterpriseAuthResult";

export type ResponseError = {
	code: number;
	message: string;
};

class EnterpriseApi {
	constructor(private _gesUrl: string) {}

	async check() {
		try {
			if (!this._gesUrl.includes("http")) return false;

			const signal = AbortSignal.timeout(10000);

			try {
				const res = await fetch(`${this._gesUrl}/enterprise/health-hwREfnmK`, { signal });
				return res.ok;
			} catch {
				return false;
			}
		} catch {
			return false;
		}
	}

	async getUser(token: string) {
		if (!this._gesUrl) return;

		try {
			const headers = {
				Authorization: `Bearer ${token ? token : "null"}`,
			};
			const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user`, {
				headers,
				credentials: "include",
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
					props: { branches?: string[]; mainBranch: string; mainBranchProtected: boolean };
				}[];
			};

			const catalogsPermissions = data.catalogsPermissions;
			const newCatalogsPermissions: { [catalogName: string]: string[] } = {};
			const newCatalogsProps: {
				[catalogName: string]: { branches?: string[]; mainBranch: string; mainBranchProtected: boolean };
			} = {};
			catalogsPermissions.forEach(({ resourceId, permissions, props }) => {
				const split = resourceId.split("/");
				const catalogName = split.pop();
				if (!catalogName) return;
				newCatalogsPermissions[catalogName] = permissions;
				newCatalogsProps[catalogName] = props;
			});
			return { ...data, catalogsPermissions: newCatalogsPermissions, catalogsProps: newCatalogsProps };
		} catch (e) {
			console.error(e);
		}
	}

	async checkIsAdmin(token: string): Promise<EnterpriseAuthResult> {
		const headers = {
			Authorization: `Bearer ${token}`,
		};
		const url = `${this._gesUrl}/enterprise/config/check`;
		try {
			const res = await fetch(url, { headers, credentials: "include" });
			return res.status === 200 ? EnterpriseAuthResult.Permitted : EnterpriseAuthResult.Forbidden;
		} catch {
			return EnterpriseAuthResult.Error;
		}
	}

	async getUsers(search: string, token: string): Promise<{ name: string; email: string }[]> {
		if (!search?.trim()) return [];
		const res = await fetch(`${this._gesUrl}/sso/connectors/getUsers`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ emailOrCn: search }),
			credentials: "include",
		});
		if (!res.ok) {
			console.error(await res.json());
			return [];
		}
		return res.json();
	}

	async isEnabledGetUsers(): Promise<boolean> {
		const res = await fetch(`${this._gesUrl}/sso/connectors/enabled`, { credentials: "include" });
		return res.ok && res.status === 200;
	}

	async getGroups(search: string, token: string): Promise<{ id: string; name: string }[]> {
		const res = await fetch(`${this._gesUrl}/sso/connectors/getGroups`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ groupName: search }),
			credentials: "include",
		});
		if (!res.ok) {
			console.error(await res.json());
			return [];
		}
		return res.json();
	}

	async isEnabledGetGroups(): Promise<boolean> {
		const res = await fetch(`${this._gesUrl}/sso/connectors/groups/enabled`, { credentials: "include" });
		return res.ok && res.status === 200;
	}

	async logout(token: string) {
		const url = `${this._gesUrl}/enterprise/sso/logout`;

		let res: Response;
		try {
			res = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
				credentials: "include",
			});
		} catch {
			throw this._logoutError();
		}

		if (res.ok) return;

		if (res.status === 404 || res.status >= 500) {
			console.warn(`Enterprise logout fallback for ${url}: ${res.status} ${res.statusText}`);
			return;
		}

		throw this._logoutError();
	}

	private _logoutError() {
		return new DefaultError(
			stripMarkup(t("enterprise.logout.error-message").replace("{url}", this._gesUrl)),
			null,
			{ errorCode: EnterpriseErrorCode.LogoutFailed, showCause: false, url: this._gesUrl },
			false,
			t("enterprise.logout.error"),
		);
	}

	async checkStyleGuide(paragraphs: CheckChunk[]): Promise<CheckSuggestion[] | ResponseError> {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/style-guide/check`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chunks: paragraphs }),
				credentials: "include",
			});
			const status = res.status;
			if (status === 503) return { code: status, message: t("style-guide.disabled") };

			if (!res.ok) return { code: status, message: t("style-guide.failed-to-check") };
			return await res.json();
		} catch (e) {
			console.error(e);
			return { code: 500, message: t("style-guide.failed-to-check") };
		}
	}

	async healthcheckStyleGuide() {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/style-guide/health`, { credentials: "include" });
			return res.ok;
		} catch {
			return false;
		}
	}

	async initStorage(token: string, resourceId: string) {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/config/init-repo`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ resourceId }),
				credentials: "include",
			});
			if (res.status === 403) throw new DefaultError(t("enterprise.init-repo.forbidden"));
			if (res.status === 409) throw new DefaultError(t("enterprise.init-repo.already-exists"));

			return res.ok;
		} catch (e) {
			if (e instanceof DefaultError) throw e;
			throw new DefaultError(t("enterprise.init-repo.error"), e, { showCause: true });
		}
	}

	async getToken(oneTimeCode: string) {
		if (!this._gesUrl || !oneTimeCode) return;

		const res = await fetch(`${this._gesUrl}/enterprise/sso/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ oneTimeCode }),
			credentials: "include",
		});
		if (!res.ok || res.status !== 200) {
			console.error("Failed to get token:", res.status);
			return;
		}

		return await res.text();
	}

	async getUserSettings(token: string): Promise<UserSettings> {
		if (!this._gesUrl || !token) return;

		const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user-settings`, {
			headers: { Authorization: `Bearer ${token}` },
			credentials: "include",
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
			credentials: "include",
		});

		if (res.status === 403) throw new DefaultError(t("enterprise.add-reviews.forbidden"));
		if (res.status === 400) throw new DefaultError(t("enterprise.add-reviews.not-found"));

		return res.ok && res.status === 200;
	}

	async getClientWorkspace(configHash?: string): Promise<EnterpriseWorkspaceConfig> {
		if (!this._gesUrl) return;

		try {
			const url = new URL(`${this._gesUrl}/enterprise/config/get-workspace-config`);
			if (configHash) {
				url.searchParams.append("hash", configHash);
			}

			const res = await fetch(url.toString(), { credentials: "include" });

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
			credentials: "include",
		});

		if (res.status === 429) return { status: res.status, timeLeft: (await res.json())?.timeLeft };

		return { status: res.status };
	}

	async mailLoginOTP(email: string, otp: string) {
		const res = await fetch(`${this._gesUrl}/enterprise/mail/login-otp`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, otp }),
			credentials: "include",
		});

		if (!res.ok) return;

		return await res.json();
	}

	async existsQuizTest(token: string, testId: number): Promise<boolean> {
		try {
			const res = await fetch(
				`${this._gesUrl}/enterprise/modules/quiz/test/exist?id=${encodeURIComponent(testId)}`,
				{
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				},
			);

			if (!res.ok) return false;

			return await res.json();
		} catch {
			return false;
		}
	}

	async addQuizTest(token: string, test: QuizTestCreate): Promise<boolean> {
		const res = await fetch(`${this._gesUrl}/enterprise/modules/quiz/test/add`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify(test),
		});

		if (!res.ok) return false;

		return await res.json();
	}

	async addQuizAnswer(token: string, answer: QuizAnswerCreate): Promise<boolean> {
		const res = await fetch(`${this._gesUrl}/enterprise/modules/quiz/answer/add`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify(answer),
		});

		if (!res.ok) return false;

		return await res.json();
	}

	async healthcheckAccessTokens(): Promise<boolean> {
		try {
			const res = await fetch(`${this._gesUrl}/enterprise/config/access-tokens/health`, {
				credentials: "include",
			});
			return res.status === 204;
		} catch {
			return false;
		}
	}

	async getAccessTokens(token: string): Promise<AccessTokenItem[]> {
		const res = await fetch(`${this._gesUrl}/enterprise/config/access-tokens/get`, {
			headers: { Authorization: `Bearer ${token}` },
			credentials: "include",
		});

		if (!res.ok) throw new Error(`Failed to get access tokens: ${res.status}`);

		const data: { tokens: AccessTokenItem[] } = await res.json();
		return data.tokens;
	}

	async createAccessToken(token: string, payload: { name: string; expiresAt: string }): Promise<string> {
		const res = await fetch(`${this._gesUrl}/enterprise/config/access-tokens/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify(payload),
			credentials: "include",
		});

		if (!res.ok) throw new Error(`Failed to create access token: ${res.status}`);

		const data: { token: string } = await res.json();
		return data.token;
	}

	async revokeAccessToken(token: string, id: string): Promise<void> {
		const res = await fetch(`${this._gesUrl}/enterprise/config/access-tokens/revoke`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ id: String(id) }),
			credentials: "include",
		});

		if (!res.ok) throw new Error(`Failed to revoke access token: ${res.status}`);
	}

	async getQuizTestByUser(token: string, testId: number, userMail: string): Promise<QuizAnswerCreate["answers"]> {
		try {
			const res = await fetch(
				`${this._gesUrl}/enterprise/modules/quiz/answer/get-by-user?test_id=${encodeURIComponent(
					testId,
				)}&user_mail=${encodeURIComponent(userMail)}`,
				{
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				},
			);

			if (!res.ok) return [];

			return (await res.json())?.data;
		} catch {
			return [];
		}
	}
}

export default EnterpriseApi;
