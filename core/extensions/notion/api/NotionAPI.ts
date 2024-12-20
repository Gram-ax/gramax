import resolveModule from "@app/resolveModule/frontend";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { SourceAPI, SourceUser } from "@ext/git/actions/Source/SourceAPI";
import t from "@ext/localization/locale/translate";
import NotionSourceData from "@ext/notion/model/NotionSourceData";
import { NotionBlock, NotionPage } from "@ext/notion/model/NotionTypes";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export default class NotionAPI implements SourceAPI {
	constructor(protected _data: NotionSourceData, private _authServiceUrl?: string) {}

	async getContent(pageId: string): Promise<NotionBlock[]> {
		const res = await this._paginationApi(`blocks/${pageId}/children`);
		if (res.status !== 200) {
			console.log(`Failed to fetch content. Response: ${JSON.stringify(res)}`);
			return [];
		}
		return res.body;
	}

	async getAllPages(): Promise<NotionPage[]> {
		await this._checkVPN();
		const res = await this._paginationApi("search", "POST");
		if (res.status !== 200) throw new Error(`${res.status} ${JSON.stringify(res.body, null, 2)}`);
		return res.body;
	}

	async downloadAttachment(downloadLink: string) {
		const res = await this._api(downloadLink);
		if (res.status !== 200) throw new Error(`${res.status} ${JSON.stringify(res.body)}`);

		return {
			blob: new Blob([res.body], { type: "application/octet-stream" }),
			contentType: res.contentType,
		};
	}

	async removeExpiredCredentials(): Promise<string> {
		if (await this.isCredentialsValid()) return null;
		return getStorageNameByData(this._data);
	}

	async isCredentialsValid(): Promise<boolean> {
		try {
			const res = await this._api("users");
			if (res.body.message === "API token is invalid.") return false;
		} catch {
			/* empty */
		}
		return true;
	}

	getUser(): Promise<SourceUser> {
		return;
	}

	async assertStorageExist() {
		// empty
	}

	private async _checkVPN() {
		const res = await this._api("users");
		if (res.body.message === "This user's account is restricted from accessing the public API.")
			throw new DefaultError(
				t("unsupported-elements.notion.region-restricted.message"),
				null,
				{},
				null,
				t("unsupported-elements.notion.region-restricted.title"),
			);
	}

	private async _paginationApi(url: string, method: string = "GET", limit?: number) {
		const result = [];
		let nextCursor: string;

		do {
			const isGet = method === "GET";
			const requestUrl = isGet
				? `${url}${nextCursor ? `?start_cursor=${nextCursor}` : ""}${
						limit ? `${nextCursor ? "&" : "?"}page_size=${limit}` : ""
				  }`
				: url;

			const requestBody = !isGet
				? JSON.stringify({
						...(nextCursor && { start_cursor: nextCursor }),
						...(limit && { page_size: limit }),
				  })
				: null;
			const res = await this._api(requestUrl, method, requestBody);
			if (res.status !== 200) return res;

			const json = res.body;
			result.push(...json.results);

			nextCursor = json?.next_cursor;
		} while (nextCursor);

		return { status: 200, body: result };
	}

	private async _api(
		url: string,
		method = "GET",
		requestBody?,
	): Promise<{ status: number; body?: any; contentType?: string }> {
		const isNotionApi = !url.startsWith("http");
		const fetchOptions = {
			url: isNotionApi ? `https://api.notion.com/v1/${url}` : url,
			method,
			...(isNotionApi && {
				headers: { "Notion-Version": "2022-06-28" },
				auth: { token: this._data.token },
				...(requestBody && { body: requestBody }),
			}),
		};

		for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
			try {
				const { status, body, contentType } = await resolveModule("httpFetch")(fetchOptions);
				if (status !== null && status !== 429) {
					return {
						status,
						body: contentType.includes("application/json")
							? JSON.parse(body.data as string)
							: new Uint8Array(body.data as number[]),
						contentType,
					};
				}
			} catch (error) {
				console.error(`Error on attempt ${attempt + 1}:`, error);
			}
			await new Promise((_resolve) => setTimeout(_resolve, RETRY_DELAY_MS));
		}

		return { status: 500, body: "Internal Server Error" };
	}
}
