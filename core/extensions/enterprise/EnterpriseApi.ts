import UserSettings from "@ext/enterprise/UserSettings";
import UserInfo from "@ext/security/logic/User/UserInfo";

class EnterpriseApi {
	constructor(private _gesUrl: string) {}

	async getUser(token: string) {
		if (!this._gesUrl) return;

		try {
			const sendToken = token ? encodeURIComponent(token) : "null";
			const res = await fetch(`${this._gesUrl}/enterprise/sso/get-user?token=${sendToken}`);
			if (!res.ok || res.status !== 200) return;

			const data = (await res?.json?.()) as {
				info?: UserInfo;
				globalPermission?: string[];
				enterprisePermissions?: { resourceId: string; permissions: string[] }[];
			};
			if (!data) return;

			const enterprisePermissions = data.enterprisePermissions;
			const newEnterprisePermissions: { [catalogName: string]: string[] } = {};
			enterprisePermissions.forEach(({ resourceId, permissions }) => {
				const catalogName = resourceId.split("/")?.[1];
				if (!catalogName) return;
				newEnterprisePermissions[catalogName] = permissions;
			});
			return { ...data, enterprisePermissions: newEnterprisePermissions };
		} catch (e) {
			console.error(e);
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
