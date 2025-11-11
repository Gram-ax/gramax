import type { CheckSettings } from "@ext/enterprise/components/admin/settings/check/CheckComponent";
import { GroupValue } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { EditorsSettings } from "@ext/enterprise/components/admin/settings/editors/types/EditorsComponentTypes";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import type { MailSettings } from "@ext/enterprise/components/admin/settings/MailComponent";
import { QuizTableFilters } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTableControls";
import { QuizSettings } from "@ext/enterprise/components/admin/settings/quiz/QuizComponent";
import {
	QuizTest,
	QuizTestData,
	SearchedAnsweredUsers,
	SearchedAnsweredUsersResponse,
	SearchedQuizTest,
	SearchedQuizTestResponse,
} from "@ext/enterprise/components/admin/settings/quiz/types/QuizComponentTypes";
import type { ResourcesSettings } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { WorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/types/WorkspaceComponent";
import { RequestCursor, RequestData } from "@ext/enterprise/components/admin/ui-kit/table/LazyInfinityTable";
import t from "@ext/localization/locale/translate";

export interface searchUserInfo {
	email: string;
	name: string;
}

class EnterpriseService {
	constructor(private _url: string) {}

	private clearUserCookie(): void {
		document.cookie = "userInfo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
		document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
	}

	private checkUnauthorized(response: Response): void {
		if (response.status === 401 || response.status === 403) {
			this.clearUserCookie();
		}
	}

	async isAdmin(token: string): Promise<boolean> {
		const res = await fetch(`${this._url}/enterprise/config/check`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		this.checkUnauthorized(res);
		return res.status !== 401 && res.status !== 403;
	}

	async logout(token: string) {
		const res = await fetch(`${this._url}/enterprise/sso/logout`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			throw new Error("Не удалось завершить сессию. Статус: " + res.status);
		}

		this.clearUserCookie();
	}

	async checkDataProviderHealth(): Promise<boolean> {
		const res = await fetch(`${this._url}/enterprise/data-provider-health`);
		if (!res.ok) return false;
		return res.status === 200;
	}

	private async _getWithEtag<T>(
		url: string,
		token: string,
		etag?: string,
	): Promise<{ data: T | null; etag: string | null; notModified: boolean }> {
		if (!this._url || !token) throw new Error("Failed to get data: no URL or token");
		try {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${token}`,
			};
			if (etag) headers["If-None-Match"] = etag;

			const res = await fetch(url, { headers });

			this.checkUnauthorized(res);

			if (res.status === 304) {
				return { data: null, etag: etag ?? null, notModified: true };
			}

			if (res.status === 401 || res.status === 403) {
				throw new Error("Не удалось получить данные: требуется авторизация.");
			}

			if (!res.ok) {
				throw new Error(`Не удалось получить данные: ${res.status}`);
			}

			const nextEtag = res.headers.get("ETag");
			const data = (await res.json()) as T;
			return { data, etag: nextEtag, notModified: false };
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	// Per-tab GET methods with ETag support
	async getWorkspaceConfig(
		token: string,
		etag?: string,
	): Promise<{ data: WorkspaceSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/workspace/get`;
		return this._getWithEtag<WorkspaceSettings>(url, token, etag);
	}

	async getGroupsConfig(
		token: string,
		etag?: string,
	): Promise<{ data: GroupsSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/groups/get`;
		return this._getWithEtag<GroupsSettings>(url, token, etag);
	}

	async getEditorsConfig(
		token: string,
		etag?: string,
	): Promise<{ data: EditorsSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/editors/get`;
		return this._getWithEtag<EditorsSettings>(url, token, etag);
	}

	async getResourcesConfig(
		token: string,
		etag?: string,
	): Promise<{ data: ResourcesSettings[] | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/resources/get`;
		return this._getWithEtag<ResourcesSettings[]>(url, token, etag);
	}

	async getMailConfig(
		token: string,
		etag?: string,
	): Promise<{ data: MailSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/mail/get`;
		return this._getWithEtag<MailSettings>(url, token, etag);
	}

	async getGuestsConfig(
		token: string,
		etag?: string,
	): Promise<{ data: GuestsSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/guests/get`;
		return this._getWithEtag<GuestsSettings>(url, token, etag);
	}

	async getCheckConfig(
		token: string,
		etag?: string,
	): Promise<{ data: CheckSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/check-config/get`;
		return this._getWithEtag<CheckSettings>(url, token, etag);
	}

	async getQuizConfig(
		token: string,
		etag?: string,
	): Promise<{ data: QuizSettings | null; etag: string | null; notModified: boolean }> {
		const url = `${this._url}/enterprise/config/quiz/get`;
		return this._getWithEtag<QuizSettings>(url, token, etag);
	}

	async getResources(token: string, page: number): Promise<{ repos: string[]; total: number } | null> {
		if (!this._url) return null;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
			};

			const res = await fetch(`${this._url}/enterprise/git/get-repos?page=${page}`, {
				headers,
			});

			this.checkUnauthorized(res);

			if (!res.ok) {
				return null;
			}
			const data = await res.json();
			return data;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async getBranches(token: string, repoName: string): Promise<string[]> {
		if (!this._url) return [];
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
			};
			const res = await fetch(
				`${this._url}/enterprise/git/get-branches?&repoName=${encodeURIComponent(repoName)}`,
				{
					headers,
				},
			);

			this.checkUnauthorized(res);

			return res.ok ? await res.json() : [];
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	// Per-tab SET helpers
	async setWorkspace(token: string, workspace: WorkspaceSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/workspace/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(workspace),
			});
			this.checkUnauthorized(res);

			if (!res.ok) throw new Error("Не удалось сохранить данные пространства. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async addGroup(token: string, group: { groupId: string; groupValue: GroupValue[] }) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/groups/add`, {
				method: "POST",
				headers,
				body: JSON.stringify(group),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось добавить группу. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async deleteGroups(token: string, groupIds: string[]) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/groups/delete`, {
				method: "POST",
				headers,
				body: JSON.stringify({ groupIds }),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось удалить группы. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async setEditors(token: string, editors: EditorsSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/editors/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(editors),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось сохранить данные редакторов. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async addResource(token: string, resource: ResourcesSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/resources/add`, {
				method: "POST",
				headers,
				body: JSON.stringify(resource),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось добавить репозиторий. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async deleteResources(token: string, resourceIds: string[]) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/resources/delete`, {
				method: "POST",
				headers,
				body: JSON.stringify({ resourceIds }),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось сохранить данные почтового клиента. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async setMail(token: string, mail: MailSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/mail/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(mail),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось сохранить данные почтового клиента. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async setGuests(token: string, guests: GuestsSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/guests/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(guests),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось сохранить данные внешних читателей. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async setCheck(token: string, check: CheckSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/check/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(check),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error("Не удалось сохранить данные стайлгайдов. Статус: " + res.status);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	async setQuizConfig(token: string, quiz: QuizSettings) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			};
			const res = await fetch(`${this._url}/enterprise/config/quiz/set`, {
				method: "POST",
				headers,
				body: JSON.stringify(quiz),
			});
			this.checkUnauthorized(res);
			if (!res.ok) throw new Error(`${t("enterprise.admin.quiz.errors.save-data")} ${res.status}`);
			return this._updateGitProxy(token);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private async _updateGitProxy(token: string) {
		if (!this._url) return false;
		try {
			const headers = {
				Authorization: `Bearer ${token}`,
			};
			const gitRes = await fetch(`${this._url}/update`, {
				method: "POST",
				headers,
			});
			return gitRes.ok;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async checkConnector(): Promise<boolean> {
		if (!this._url) return false;
		try {
			const res = await fetch(`${this._url}/sso/connectors/enabled`);
			return res.ok ? true : false;
		} catch (error) {
			console.error(error);
			return false;
		}
	}

	async getQuizUsersAnswers(
		token: string,
		limit: number,
		cursor: RequestCursor,
		filters?: QuizTableFilters,
	): Promise<RequestData<QuizTest>> {
		try {
			let url = `${this._url}/enterprise/quiz/answer/get-with-user?limit=${limit}`;
			if (filters.users && filters.users.length > 0) {
				url += `&users=${encodeURIComponent(JSON.stringify(filters.users))}`;
			}

			if (filters.tests && filters.tests.length > 0) {
				url += `&tests=${encodeURIComponent(JSON.stringify(filters.tests))}`;
			}

			if (cursor) url += `&cursor=${encodeURIComponent(JSON.stringify(cursor))}`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			return res.ok ? await res.json() : { data: [], has_more: false, next_cursor: null };
		} catch (error) {
			console.error(error);
			return { data: [], has_more: false, next_cursor: null };
		}
	}

	async searchQuizTest(token: string, query: string): Promise<SearchedQuizTest[]> {
		try {
			let url = `${this._url}/enterprise/quiz/test/get`;
			url += `?select=${encodeURIComponent(JSON.stringify(["title"]))}`;
			if (query) url += `&query=${encodeURIComponent(query)}`;
			url += `&distinct=true`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) return [];

			const data: SearchedQuizTestResponse = await res.json();
			return data?.data || [];
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async searchQuizAnsweredUsers(token: string, query: string): Promise<SearchedAnsweredUsers[]> {
		try {
			let url = `${this._url}/enterprise/quiz/answer/user/get`;
			url += `?select=${encodeURIComponent(JSON.stringify(["user_mail"]))}`;
			if (query) url += `&query=${encodeURIComponent(query)}`;
			url += `&distinct=true`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) return [];

			const data: SearchedAnsweredUsersResponse = await res.json();
			return data?.data || [];
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async getQuizDetailedUserAnswers(token: string, id: string): Promise<QuizTestData> {
		try {
			let url = `${this._url}/enterprise/quiz/answer/get`;
			url += `?id=${encodeURIComponent(id)}`;
			url += `&select=${encodeURIComponent(JSON.stringify(["answers", "qt.questions as questions"]))}`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) return { answers: null, questions: null };

			const json = await res.json();

			return { answers: json.data?.[0].answers, questions: json.data?.[0].questions };
		} catch (error) {
			console.error(error);
			return { answers: null, questions: null };
		}
	}

	async getUsers(query: string): Promise<searchUserInfo[]> {
		try {
			const res = await fetch(`${this._url}/sso/connectors/getUsers`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ emailOrCn: query }),
			});

			return res.ok ? await res.json() : [];
		} catch (error) {
			console.error(error);
			return [];
		}
	}
}

export default EnterpriseService;
