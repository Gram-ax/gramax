import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import CloudApi from "@ext/static/logic/CloudApi";

class VersionedCloudApi extends CloudApi {
	private _version: string;

	async getTemplateHtml() {
		const res = await this._api("/api/html-template");
		if (!res.ok) return null;
		const htmlTemplate = await res.text();
		const version = res.headers.get("X-Version");
		this._version = version;

		return htmlTemplate;
	}

	async uploadCatalogLink(catalogName: string, catalogLink: CatalogLink): Promise<void> {
		await this._api(`/api/upload-catalog-link`, {
			method: "POST",
			body: JSON.stringify({
				catalogName,
				data: catalogLink,
			}),
			headers: {
				"Content-Type": "application/json",
				"X-Version": this._version,
			},
		});
	}

	async uploadStatic(catalogName: string, buffer: Buffer): Promise<void> {
		await this._api(`/api/upload-catalog?catalogName=${catalogName}`, {
			method: "POST",
			body: buffer,
			headers: {
				"Content-Type": MimeTypes.zip,
				"X-Version": this._version,
			},
		});
	}
}

export default VersionedCloudApi;
