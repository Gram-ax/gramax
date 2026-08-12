import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import type UserSettings from "@ext/enterprise/types/UserSettings";
import type { GesCloudMember } from "@ext/enterprise-cloud/components/organizationSettings/settings/members/types/GesCloudUsersComponentTypes";
import type { GesCloudCatalogInitData } from "@ext/enterprise-cloud/types/GesCloudCatalogInitData";
import type { AccessTokenItem } from "@ext/enterpriseCommon/components/accessTokens/types/AccessTokensComponentTypes";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import t from "@ext/localization/locale/translate";
import type UserInfo from "@ext/security/logic/User/UserInfo";

interface GetMembersResponse {
	members: GesCloudMember[];
}

interface GetUserResponse {
	info: UserInfo;
}

export interface OrganizationInfo {
	id: string;
	name: string;
	redirectUrl: string;
	current: boolean;
	apiUrl: string;
	canEdit?: boolean;
}

interface GetUserOrganizationsResponse {
	organizations: OrganizationInfo[];
}

export interface Organization {
	id: string;
	name: string;
	ownerId: string;
}

interface GetOrganizationResponse {
	organization: Organization;
}

export interface GetCatalogRepositoryNameResponse {
	repositoryName: string;
	isRepositoryNameAlreadyExists: boolean;
}

export class GesCloudApi {
	private _gesCloudUrl: string;
	private readonly _fetchMode: "desktop" | "web" = "web";

	constructor(gesCloudUrl: string) {
		this._gesCloudUrl = gesCloudUrl.endsWith("/") ? gesCloudUrl.slice(0, -1) : gesCloudUrl;
		if (getExecutingEnvironment() === "tauri") this._fetchMode = "desktop";
	}

	async getCatalogInitData(): Promise<GesCloudCatalogInitData> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/catalog/get-init-data`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (!res.ok) throw new Error(`Failed to get catalog init data: ${res.status}`);
		return res.json();
	}

	async getCatalogRepositoryName(
		catalogTitle: string,
		localCatalogRepositoryNames: string[],
	): Promise<GetCatalogRepositoryNameResponse> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/catalog/repositoryName`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ catalogTitle, localCatalogRepositoryNames }),
			credentials: "include",
		});
		if (!res.ok) throw new Error(`Failed to get catalog repository name: ${res.status}`);

		const data: GetCatalogRepositoryNameResponse = await res.json();
		return data;
	}

	async inviteUser(email: string): Promise<void> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/invite`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to invite user: ${res.status}`);
		}
	}

	async getMembers(): Promise<GesCloudMember[]> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/get`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get members: ${res.status}`);
		}

		const data: GetMembersResponse = await res.json();
		return data.members;
	}

	async createToken(payload: { name: string; expiresAt: string }): Promise<string> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/access-tokens/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to create token: ${res.status}`);
		}

		const data: { token: string } = await res.json();
		return data.token;
	}

	async getTokens(): Promise<AccessTokenItem[]> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/access-tokens/get`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get tokens: ${res.status}`);
		}

		const data: { tokens: AccessTokenItem[] } = await res.json();
		return data.tokens;
	}

	async revokeToken(id: number): Promise<void> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/access-tokens/revoke`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id }),
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to revoke token: ${res.status}`);
		}
	}

	async excludeMembers(emails: string[]): Promise<void> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/exclude`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ emails }),
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to exclude members: ${res.status}`);
		}
	}

	async getUser(): Promise<GetUserResponse | null> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/sso/get-user`, {
			credentials: "include",
		});

		if (res.status === 401 || res.status === 404) return null;

		if (!res.ok) throw new Error(`Failed to get user: ${res.status}`);

		return res.json();
	}

	async getUserSettings(): Promise<UserSettings | undefined> {
		if (!this._gesCloudUrl) return;

		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/sso/get-user-settings`, {
			credentials: "include",
		});
		if (!res.ok || res.status !== 200) return;

		return await res.json();
	}

	async getUserOrganizations(): Promise<OrganizationInfo[]> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/user/organizations`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get user organizations: ${res.status}`);
		}

		const data: GetUserOrganizationsResponse = await res.json();
		return data.organizations;
	}

	async getOrganization(): Promise<Organization> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/get`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get organization: ${res.status}`);
		}

		const data: GetOrganizationResponse = await res.json();
		return data.organization;
	}

	async updateOrganization(name: string): Promise<void> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/edit`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ organization: { name } }),
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to update organization: ${res.status}`);
		}
	}

	async initStorage(resourceId: string) {
		try {
			const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/config/init-repo`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
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

	async setInitDesktopData(oneTimeCode: string): Promise<string> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/sso/token?oneTimeCode=${oneTimeCode}`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to set token: ${res.status}`);
		}

		const data = await res.json();
		return data.url;
	}

	async desktopLogout(): Promise<string> {
		const res = await this._fetch(`${this._gesCloudUrl}/enterprise-cloud/desktop/sso/logout`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to logout: ${res.status}`);
		}

		const data = await res.json();
		return data.url;
	}

	getLogoutUrl(): string {
		return `${this._gesCloudUrl}/enterprise-cloud/sso/logout`;
	}

	private async _fetch(url: string, options?: RequestInit): Promise<Response> {
		if (this._fetchMode === "desktop") return this._desktopFetch(url, options);
		return fetch(url, options);
	}

	private async _desktopFetch(url: string, options?: RequestInit): Promise<Response> {
		const { body, status, statusText, contentType } = await resolveModule("httpFetch")({
			url,
			method: options?.method || "GET",
			body: (options?.body as string) || undefined,
			headers: options?.headers ? Object.fromEntries(Object.entries(options.headers)) : undefined,
		});

		let responseBody: BodyInit | null = null;
		if (body && status !== 204) {
			if (body.type === "text") responseBody = body.data as string;
			else responseBody = new Uint8Array(body.data as number[]);
		}

		return new Response(responseBody, {
			status,
			statusText: statusText || (status >= 200 && status < 300 ? "OK" : "Error"),
			headers: contentType ? new Headers({ "Content-Type": contentType }) : new Headers(),
		});
	}
}
