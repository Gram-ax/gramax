import type UserSettings from "@ext/enterprise/types/UserSettings";
import type { GesCloudMember } from "@ext/enterprise-cloud/components/organizationSettings/settings/members/types/GesCloudUsersComponentTypes";
import type { GesCloudCatalogInitData } from "@ext/enterprise-cloud/types/GesCloudCatalogInitData";
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
	url: string;
	current: boolean;
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

export class GesCloudApi {
	constructor(private _gesCloudUrl: string) {}

	async getCatalogInitData(): Promise<GesCloudCatalogInitData> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/catalog/get-init-data`, {
			credentials: "include",
		});
		return res.json();
	}

	async inviteUser(email: string): Promise<void> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/invite`, {
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
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/get`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get members: ${res.status}`);
		}

		const data: GetMembersResponse = await res.json();
		return data.members;
	}

	async excludeMembers(emails: string[]): Promise<void> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/members/exclude`, {
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
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/sso/get-user`, {
			credentials: "include",
		});

		if (res.status === 401 || res.status === 404) return null;

		if (!res.ok) throw new Error(`Failed to get user: ${res.status}`);

		return res.json();
	}

	async getUserSettings(): Promise<UserSettings | undefined> {
		if (!this._gesCloudUrl) return;

		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/sso/get-user-settings`, {
			credentials: "include",
		});
		if (!res.ok || res.status !== 200) return;

		return await res.json();
	}

	async getUserOrganizations(): Promise<OrganizationInfo[]> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/user/organizations`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get user organizations: ${res.status}`);
		}

		const data: GetUserOrganizationsResponse = await res.json();
		return data.organizations;
	}

	async getOrganization(): Promise<Organization> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/get`, {
			credentials: "include",
		});

		if (!res.ok) {
			throw new Error(`Failed to get organization: ${res.status}`);
		}

		const data: GetOrganizationResponse = await res.json();
		return data.organization;
	}

	async updateOrganization(name: string): Promise<void> {
		const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/organization/edit`, {
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
			const res = await fetch(`${this._gesCloudUrl}/enterprise-cloud/config/init-repo`, {
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

	getLogoutUrl(): string {
		return `${this._gesCloudUrl}/enterprise-cloud/sso/logout`;
	}
}
