import resolveModule from "@app/resolveModule/frontend";
import ConfluenceServerSourceData from "@ext/confluence/core/server/model/ConfluenceServerSourceData.schema";
import ConfluenceAPI from "@ext/confluence/core/api/model/ConfluenceAPI";
import { Space, UserLink } from "@ext/confluence/core/api/model/ConfluenceAPITypes";
import { ConfluenceArticle } from "@ext/confluence/core/model/ConfluenceArticle";
import ConfluenceStorageData from "@ext/confluence/core/model/ConfluenceStorageData";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import ConfluenceAttachment from "@ext/confluence/core/api/model/ConfluenceAttachment";
import t from "@ext/localization/locale/translate";

export default class ConfluenceServerAPI implements ConfluenceAPI {
	constructor(protected _data: ConfluenceServerSourceData) {}

	async getPageData(title: string): Promise<{ id: string; link: string }> {
		const res = await this._api(`/rest/api/content?title=${title}`);
		if (res.status !== 200) return null;
		const data = res.body.results[0];
		return {
			id: data?.id,
			link: data?._links?.webui,
		};
	}

	async getSpaces(): Promise<Space[]> {
		const data = (await this._paginationApi(`/rest/api/space?`, 10)).flat();
		return data.map((space: Space) => ({
			name: space.name,
			id: space.key,
			key: space.id,
		}));
	}

	async getArticles(storageData: ConfluenceStorageData): Promise<any> {
		const format = "?expand=body.storage,ancestors";
		const data = await this._paginationApi(`/rest/api/space/${storageData.id}/content/page${format}`, 25);
		const articles: ConfluenceArticle[] = data.flat().map((result: any) => ({
			domain: this._data.domain,
			id: result.id,
			linkUi: result._links.webui,
			title: result.title,
			position: result.position,
			parentId: result.ancestors?.[result.ancestors.length - 1]?.id,
			parentType: "page",
			content: result.body.storage.value,
		}));
		return articles;
	}

	async getBlogs(storageData: ConfluenceStorageData): Promise<any> {
		const format = "?expand=body.storage";
		const data = await this._paginationApi(`/rest/api/space/${storageData.id}/content/blogpost${format}`, 25);
		const blogs: ConfluenceArticle[] = data.flat().map((result: any) => {
			return {
				domain: this._data.domain,
				id: result.id,
				linkUi: result._links.webui,
				title: result.title,
				content: result.body?.storage?.value,
			};
		});

		return blogs.reverse();
	}

	async getUserById(accountId: string): Promise<UserLink> {
		const res = await this._api(`/rest/api/user?key=${accountId}`);
		if (res.status !== 200) return null;
		const data = res.body;
		return {
			name: data.displayName,
			link: `${this._data.domain}/people/~${data.username}`,
		};
	}

	async getUser(): Promise<SourceUser> {
		const res = await this._api(`/rest/api/user/current`);
		if (res.status !== 200) return null;
		const data = res.body;
		return {
			name: data.displayName,
			email: "",
			username: data.username,
			avatarUrl: this._data.domain + data.profilePicture.path,
		};
	}

	async getPageAttachments(pageId): Promise<ConfluenceAttachment[]> {
		const data = await this._paginationApi(`/rest/api/content/${pageId}/child/attachment`);
		const attachments: ConfluenceAttachment[] = data.flat().map((result: any) => {
			return {
				id: result.id,
				title: result.title,
				mediaType: result.extensions.mediaType,
				fileSize: result.extensions.fileSize,
				downloadLink: result._links.download,
			};
		});
		return attachments;
	}

	async getAttachmentData(fileName, articleId): Promise<ConfluenceAttachment> {
		const res = await this._api(
			`/rest/api/content/${articleId}/child/attachment?filename=${encodeURIComponent(fileName)}`,
		);
		if (res.status !== 200) return null;
		const data = res.body?.results[0];
		if (!data) return;
		return {
			id: data.id,
			title: data.title,
			mediaType: data.extensions.mediaType,
			fileSize: data.extensions.fileSize,
			downloadLink: data._links.download,
			webui: data._links.webui,
		};
	}

	async downloadAttachment(downloadLink: string): Promise<Blob> {
		const res = await this._api(downloadLink);
		if (res.body instanceof Uint8Array) {
			return new Blob([res.body], { type: "application/octet-stream" });
		}
		throw new Error(`${t("confluence.error.http-2")} ${res.status}`);
	}

	async isCredentialsValid() {
		const res = await this._api(`/rest/api/user/current`);
		return !(res.status === 401 || res.status === 403);
	}

	async removeExpiredCredentials(): Promise<string> {
		if (await this.isCredentialsValid()) return null;
		return getStorageNameByData(this._data);
	}

	async assertStorageExist(): Promise<void> {
		// empty
	}

	private async _paginationApi(url: string, limit?: number): Promise<any[]> {
		const result = [];
		const firstPageUrl = `${url}${limit ? `&limit=${limit}` : ""}`;

		const res = await this._api(firstPageUrl);
		if (res.status !== 200) return [];

		const json = res.body;

		result.push(json.results);

		let nextPageUrl = json._links?.next;

		while (nextPageUrl) {
			const res = await this._api(firstPageUrl);
			if (res.status !== 200) break;
			const pageJson = res.body;

			result.push(...pageJson.results);

			nextPageUrl = pageJson._links?.next;
		}

		return result;
	}

	private async _api(url: string): Promise<{ status: number; body?: any }> {
		try {
			const res = await resolveModule("httpFetch")({
				url: `${this._data.domain}${url}`,
				auth: {
					token: this._data.token,
				},
			});
			const body = res.body.type === "text" ? JSON.parse(res.body.data) : new Uint8Array(res.body.data);
			return {
				status: res.status,
				body: body,
			};
		} catch (e) {
			console.error(e);
			return { status: 500, body: "Internal Server Error" };
		}
	}
}
