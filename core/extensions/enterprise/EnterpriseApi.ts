import UserSettings from "@ext/enterprise/types/UserSettings";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import UserInfo from "@ext/security/logic/User/UserInfo";
import type { StyleGuideGptResponseModel } from "@ics/gx-ai";
import { RequestParagraphModel } from "@ics/gx-ai/dist/styleGuideCheck/styleGuideGptRequest";

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

	async getUser(token: string) {
		if (!this._gesUrl) return;

		try {
			const sendToken = token ? encodeURIComponent(token) : "null";
			const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user?token=${sendToken}`);
			if (!res.ok || res.status !== 200) {
				console.warn(`Error retrieving user information. Status: ${res.status} Status text: ${res.statusText}`);
				return;
			}

			const data = (await res.json()) as {
				info?: UserInfo;
				globalPermission?: string[];
				enterprisePermissions?: { resourceId: string; permissions: string[] }[];
			};

			const enterprisePermissions = data.enterprisePermissions;
			const newEnterprisePermissions: { [catalogName: string]: string[] } = {};
			enterprisePermissions.forEach(({ resourceId, permissions }) => {
				const split = resourceId.split("/");
				const catalogName = split.pop();
				if (!catalogName) return;
				newEnterprisePermissions[catalogName] = permissions;
			});
			return { ...data, enterprisePermissions: newEnterprisePermissions };
		} catch (e) {
			console.log(e);
		}
	}

	async checkStyleGuide(paragraphs: RequestParagraphModel[]): Promise<StyleGuideGptResponseModel> {
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
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, resourceId }),
			});
			if (res.status == 403) throw new DefaultError(t("enterprise.init-repo.forbidden"));
			if (res.status == 409) throw new DefaultError(t("enterprise.init-repo.already-exists"));

			const resProxy = await fetch(`${this._gesUrl}/update?token=${encodeURIComponent(token)}`);
			if (res.status == 403) throw new DefaultError(t("enterprise.init-repo.forbidden"));

			return res.ok && resProxy.ok;
		} catch (e) {
			if (e instanceof DefaultError) throw e;
			throw new DefaultError(t("enterprise.init-repo.error"), e, { showCause: true });
		}
	}

	async getUserSettings(token: string): Promise<UserSettings> {
		if (!this._gesUrl || !token) return;

		const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user-settings?token=${encodeURIComponent(token)}`);
		if (!res.ok || res.status !== 200) return;

		return await res.json();
	}
}

export default EnterpriseApi;
