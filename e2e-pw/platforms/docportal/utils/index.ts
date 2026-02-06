import type GitSourceData from "@gramax/core/extensions/git/core/model/GitSourceData.schema";
import type UserInfo from "@gramax/core/extensions/security/logic/User/UserInfo";
import type { Page } from "@playwright/test";

export type SourceData = GitSourceData;
export type { UserInfo };

export interface UserData {
	type?: "base" | "enterprise" | "ticket";
	info?: UserInfo;
	isLogged: boolean;
	globalPermission?: { permissions: string[] };
	catalogPermission?: Record<string, { permissions: string[] }>;
	workspacePermission?: Record<string, { permissions: string[] }>;
}

export interface AuthCredentials {
	login: string;
	password: string;
}

export const setStorageViaApi = async (page: Page, data: SourceData, baseURL: string): Promise<string> => {
	const response = await page.request.post(`${baseURL}/api/storage/sourceData/setSourceData`, {
		data,
	});

	if (!response.ok()) {
		throw new Error(`Failed to set source data: ${response.status()} ${await response.text()}`);
	}

	return response.text();
};

export const loginViaApi = async (page: Page, credentials: AuthCredentials, baseURL: string): Promise<void> => {
	const response = await page.request.post(`${baseURL}/api/auth/assert`, {
		data: credentials,
	});

	if (!response.ok()) {
		throw new Error(`Failed to login: ${response.status()} ${await response.text()}`);
	}
};

export const createDefaultCredentials = (): AuthCredentials => ({
	login: process.env.ADMIN_LOGIN || "1",
	password: process.env.ADMIN_PASSWORD || "1",
});
