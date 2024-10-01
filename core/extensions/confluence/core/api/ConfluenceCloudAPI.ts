import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ConfluenceCloudSourceData from "@ext/confluence/core/cloud/model/ConfluenceCloudSourceData";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import { ConfluenceInstance, Space, UserLink } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import t from "@ext/localization/locale/translate";
import ConfluenceAttachment from "@ext/confluence/core/api/model/ConfluenceAttachment";

export default class ConfluenceCloudAPI implements ConfluenceAPI {
	constructor(protected _data: ConfluenceCloudSourceData, private _authServiceUrl?: string) {}

	async getInstanceData(): Promise<ConfluenceInstance> {
		const res = await this._api("oauth/token/accessible-resources");
		if (!res.ok) return null;
		const data = await res.json();
		const instance = data[0];
		return {
			name: instance.name,
			url: instance.url,
			id: instance.id,
		};
	}

	async getSecondaryElements(parentType: string, parentId: string) {
		const res = await this._api(`ex/confluence/${this._data.cloudId}/wiki/api/v2/${parentType}s/${parentId}`);
		if (!res.ok) return null;
		return await res.json();
	}

	async getSpaces(): Promise<Space[]> {
		if (!this._data.token) return;
		const data = (
			await this._paginationApi(`ex/confluence/${this._data.cloudId}/wiki/api/v2/spaces?`, null, 10)
		).flat();
		return data.map((space: Space) => ({
			name: space.name,
			id: space.id,
			key: space.key,
		}));
	}

	async getArticles(storageData: ConfluenceStorageData): Promise<any> {
		const format = "?body-format=ATLAS_DOC_FORMAT";
		const data = await this._paginationApi(
			`ex/confluence/${this._data.cloudId}/wiki/api/v2/spaces/${storageData.id}/pages${format}`,
			null,
			10,
		);
		const articles: ConfluenceArticle[] = data.flat().map((result: any) => ({
			domain: this._data.domain,
			id: result.id,
			linkUi: result._links.webui,
			title: result.title,
			position: result.position,
			parentId: result.parentId,
			parentType: result.parentType,
			content: result.body.atlas_doc_format.value,
		}));
		return articles;
	}

	async getBlogs(storageData: ConfluenceStorageData): Promise<ConfluenceArticle[]> {
		const format = "?body-format=ATLAS_DOC_FORMAT";
		const data = await this._paginationApi(
			`ex/confluence/${this._data.cloudId}/wiki/api/v2/spaces/${storageData.id}/blogposts${format}`,
			null,
			10,
		);
		const blogs: ConfluenceArticle[] = data.flat().map((result: any) => ({
			domain: this._data.domain,
			id: result.id,
			linkUi: result._links.webui,
			title: result.title,
			content: result.body.atlas_doc_format.value,
		}));
		return blogs;
	}

	async getUserById(accountId: string): Promise<UserLink> {
		const res = await this._api(`ex/confluence/${this._data.cloudId}/wiki/rest/api/user?accountId=${accountId}`);
		if (!res.ok) return null;
		const data = await res.json();
		return {
			name: data.displayName,
			link: `${data._links.base}/people/${accountId}`,
		};
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api(`ex/confluence/${this._data.cloudId}/wiki/rest/api/user/current`);
		if (!res.ok) return null;
		const data = await res.json();
		return {
			name: data.displayName,
			email: data.email,
			username: data.displayName,
			avatarUrl: this._data.domain + data.profilePicture.path,
		};
	}

	async getPageAttachments(pageId: string): Promise<ConfluenceAttachment[]> {
		let res = await this._paginationApi(
			`ex/confluence/${this._data.cloudId}/wiki/api/v2/pages/${pageId}/attachments`,
		);

		if (!res.length)
			res = await this._paginationApi(
				`ex/confluence/${this._data.cloudId}/wiki/api/v2/blogposts/${pageId}/attachments`,
			);

		const attachments: ConfluenceAttachment[] = res.flat().map((result: any) => {
			return {
				id: result.id,
				title: result.title,
				mediaType: result.mediaType,
				fileSize: result.fileSize,
				fileId: result.fileId,
			};
		});
		return attachments;
	}

	async getAttachmentData(fileName) {
		const res = await this._api(`ex/confluence/${this._data.cloudId}/wiki/api/v2/attachments?filename=${fileName}`);
		if (!res.ok) return null;
		const data = await res.json();
		return data.results;
	}

	async downloadAttachment(downloadLink: string) {
		const res = await this._api(downloadLink);
		if (!res.ok) throw new Error(`${t("confluence.error.http-2")} ${res.status}`);
		return res.blob();
	}

	async isCredentialsValid() {
		try {
			const res = await this._api(`oauth/token/accessible-resources`);
			if (res.status == 401 || res.status == 403) return false;
		} catch {
			/* empty */
		}
		return true;
	}

	async removeExpiredCredentials(apiUrlCreator: ApiUrlCreator): Promise<string> {
		if (await this.isCredentialsValid()) return null;
		const removeSourceName = getStorageNameByData(this._data);

		if (!this._isRefreshableSource(this._data)) return removeSourceName;
		const newSourceData = await this._refreshAccessToken();
		if (!newSourceData?.token) return removeSourceName;

		await FetchService.fetch(apiUrlCreator.setSourceData(), JSON.stringify(newSourceData), MimeTypes.json);
		return null;
	}

	private async _refreshAccessToken(): Promise<ConfluenceCloudSourceData> {
		const url = `${this._authServiceUrl}/confluence-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const newData = await res.json();
		this._data.token = newData.token;
		this._data.refreshToken = newData.refreshToken;
		return this._data ?? null;
	}

	async assertStorageExist(): Promise<void> {
		//empty
	}

	private _isRefreshableSource(data: ConfluenceCloudSourceData): boolean {
		return !!data?.refreshToken;
	}

	private async _paginationApi(url: string, init?: RequestInit, limit?: number): Promise<any[]> {
		const result = [];
		const firstPageUrl = `${url}${limit ? `&limit=${limit}` : ""}`;

		const res = await this._api(firstPageUrl, init);
		if (!res.ok) return [];

		const json = await res.json();
		result.push(json.results);

		let nextPageUrl = json._links?.next;

		while (nextPageUrl) {
			const response = await this._api(`ex/confluence/${this._data.cloudId}${nextPageUrl}`, init);
			if (!response.ok) break;

			const pageJson = await response.json();
			result.push(...pageJson.results);

			nextPageUrl = pageJson._links?.next;
		}

		return result;
	}

	private async _api(url: string, init?: RequestInit): Promise<Response> {
		const res = await fetch(`https://api.atlassian.com/${url}`, {
			...init,
			headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${this._data.token}` },
		});
		if (!res.ok) {
			if (res.status == 401) return { status: 401 } as any;
			console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
			return { ok: false } as any;
		}
		return res;
	}
}
