import { getExecutingEnvironment } from "@app/resolveModule/env";
import { relocateToUrl } from "@ext/enterprise/components/SingInOut/hooks/useSignIn";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import type { GesCloudManager } from "@ext/enterprise-cloud/GesCloudManager";
import AuthManager from "@ext/security/logic/AuthManager";
import AllPermission from "@ext/security/logic/Permission/AllPermission";
import AllPermissionMap from "@ext/security/logic/PermissionMap/AllPermissionMap";
import localUser from "@ext/security/logic/User/localUser";
import User from "@ext/security/logic/User/User";

export class ClientGesCloudAuthManager extends AuthManager {
	private _cachedUser: User | null | undefined = undefined;

	constructor(private _enterpriseCloudManager: GesCloudManager) {
		super();
	}

	async login() {}
	async assert() {}
	async mailSendOTP() {}
	async mailLoginOTP() {}

	async logout() {
		this._cachedUser = undefined;
		if (getExecutingEnvironment() === "tauri") {
			const enterpriseCloudApi = new GesCloudApi(this._enterpriseCloudManager.getConfig().url);
			const baseUrl = await enterpriseCloudApi.desktopLogout();
			await this._enterpriseCloudManager.setGesCloudUrl(baseUrl);
			await refreshPage();
		} else {
			const enterpriseCloudApi = new GesCloudApi(this._enterpriseCloudManager.getConfig().url);
			relocateToUrl(enterpriseCloudApi.getLogoutUrl());
		}
	}

	setUser(): void {
		this._cachedUser = undefined;
	}

	async getUser(): Promise<User> {
		if (this._cachedUser !== undefined) return Promise.resolve(this._cachedUser);

		let finalUser: User;

		const enterpriseCloudApi = new GesCloudApi(this._enterpriseCloudManager.getConfig().url);
		const userResponse = await enterpriseCloudApi.getUser();

		if (userResponse) {
			finalUser = new User(
				true,
				userResponse.info,
				new AllPermission(),
				new AllPermissionMap(),
				new AllPermissionMap(),
			);
		} else finalUser = localUser;

		this._cachedUser = finalUser;

		return this._cachedUser;
	}
}
