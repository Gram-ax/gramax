import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { SourceUser } from "@ext/git/actions/Source/SourceAPI";
import getStorageNameByData from "@ext/storage/logic/utils/getStorageNameByData";
import YandexDiskAPI from "@ext/yandexDisk/api/model/YandexDiskAPI";
import YandexDiskSourceData from "@ext/yandexDisk/model/YandexDiskSourceData";
import { YandexDiskApiResponse } from "@ext/yandexDisk/api/model/YandexDiskAPITypes";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";

export default class YandexDiskServiceAPI implements YandexDiskAPI {
	constructor(protected _data?: YandexDiskSourceData, private _authServiceUrl?: string) {}

	async assertStorageExist(): Promise<void> {
		//empty
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

	async isCredentialsValid(): Promise<boolean> {
		try {
			const res = await fetch(`https://login.yandex.ru/info`, {
				headers: {
					Authorization: `OAuth ${this._data.token}`,
				},
			});
			if (res.status === 401 || res.status === 403) return false;
		} catch (error) {}
		return true;
	}

	async getUser(): Promise<SourceUser> {
		const res = await fetch("https://login.yandex.ru/info", {
			headers: { Authorization: `Oauth ${this._data.token}` },
		});
		if (!res.ok) return null;
		const data = await res.json();
		return {
			name: data.display_name,
			email: data.default_email,
			username: data.login,
			avatarUrl: null,
		};
	}

	private async fetchWithRetries(
		url: string,
		method: string = "GET",
		headers: Record<string, string> = {},
		retries: number = 3,
		delay: number = 1000,
	): Promise<Response> {
		for (let attempt = 0; attempt < retries; attempt++) {
			try {
				const response = await fetch(`https://cloud-api.yandex.net${url}`, {
					method,
					headers: {
						Authorization: `OAuth ${this._data.token}`,
						"Content-Type": "application/json",
						...headers,
					},
				});

				if (response.ok) {
					return response;
				} else {
					console.error(`Error: ${response.status} ${response.statusText}`);
				}
			} catch (error) {
				console.error(error);
			}

			await new Promise((resolve) => setTimeout(resolve, delay));
		}

		throw new Error(`Failed to fetch ${url}`);
	}

	async getFolderContents(path: string): Promise<YandexDiskApiResponse> {
		const url = `/v1/disk/resources?path=${encodeURIComponent(path)}&limit=1000`;
		const response = await this.fetchWithRetries(url);
		return response.json();
	}

	async getFileDownloadLink(filePath: string): Promise<string> {
		const url = `/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`;
		const response = await this.fetchWithRetries(url);
		const data = await response.json();
		return data.href;
	}

	private async _refreshAccessToken(): Promise<YandexDiskSourceData> {
		const url = `${this._authServiceUrl}/yandexdisk-refresh?refreshToken=${this._data.refreshToken}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const newData = await res.json();
		this._data.token = newData.token;
		this._data.refreshToken = newData.refreshToken;
		return this._data ?? null;
	}

	private _isRefreshableSource(data: YandexDiskSourceData): boolean {
		return !!data?.refreshToken;
	}
}
