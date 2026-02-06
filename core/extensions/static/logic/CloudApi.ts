import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import t from "@ext/localization/locale/translate";
import Theme from "@ext/Theme/Theme";

type OAuthType = "google";

class CloudApi {
	constructor(
		protected _cloudUrl: string,
		private _onError?: (error: NetworkApiError | DefaultError) => void,
	) {}

	getCatalogLogoUrl(catalogName: string, theme: Theme, login: string): string {
		return `${this._cloudUrl}/api/get-catalog-logo?catalogName=${catalogName}&theme=${theme}&login_name=${login}`;
	}

	getOauthUrl(type: OAuthType, redirectUrl?: string) {
		return `${this._cloudUrl}/oauth?auth_type=${type}${
			redirectUrl ? `&redirect=${encodeURIComponent(redirectUrl)}` : ""
		}`;
	}

	getLoginSuccessUrl() {
		return `${this._cloudUrl}/login/success`;
	}

	async signIn(query: string) {
		await this._api(`/api/generate-cookie${query}`, {}, false);
	}

	async signOut() {
		await this._api("/api/reset-cookie", {}, false);
	}

	async getServerState(): Promise<boolean> {
		try {
			await this._api("/api/auth-status", {}, false);
			return true;
		} catch (e) {
			return !!(e instanceof NetworkApiError);
		}
	}

	async getAuthClientName(): Promise<string> {
		let res: Response;

		try {
			res = await this._api("/api/auth-status", {}, false);
		} catch {
			return null;
		}
		const data = await res.json();
		return data?.clientName;
	}

	async deleteCatalog(catalogName: string): Promise<void> {
		await this._api(`/api/delete-catalog`, {
			headers: {
				"Content-Type": "application/json",
			},
			method: "DELETE",
			body: JSON.stringify({ name: catalogName }),
		});
	}

	async getCatalogPublishDate(catalogName: string): Promise<string> {
		let res: Response;

		try {
			res = await this._api(`/api/get-catalog-publish-date?catalogName=${encodeURIComponent(catalogName)}`, {
				headers: {
					"Content-Type": "application/json",
				},
				method: "GET",
			});
		} catch {
			return null;
		}
		const data = await res.json();
		return data?.publisingDate;
	}

	protected async _api(path: string, options: RequestInit = {}, triggerOnErrorCallback = true): Promise<Response> {
		let res: Response;
		try {
			res = await fetch(`${this._cloudUrl}${path}`, {
				...options,
				credentials: "include",
			});
		} catch (e) {
			const error = new DefaultError(t("cloud.error.failed-to-connect"), e);
			if (triggerOnErrorCallback) this._onError?.(error);
			throw error;
		}
		if (res.ok) return res;

		const error = new NetworkApiError(t("cloud.error.request-failed"), {
			url: path,
			errorJson: res.statusText,
			status: res.status,
		});
		if (triggerOnErrorCallback) this._onError?.(error);
		throw error;
	}
}

export default CloudApi;
