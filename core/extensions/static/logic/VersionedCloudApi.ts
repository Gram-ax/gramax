import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import { CatalogLink } from "@ext/navigation/NavigationLinks";
import CloudApi from "@ext/static/logic/CloudApi";
import CloudUploadStatus, { UploadStatus } from "@ext/static/logic/CloudUploadStatus";

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
		const setStatus = (status: UploadStatus) => {
			CloudUploadStatus.set(catalogName, status);
		};

		await this._apiUploadWithProgress(
			`/api/upload-catalog?catalogName=${catalogName}`,
			{
				method: "POST",
				body: buffer,
				headers: {
					"Content-Type": MimeTypes.zip,
					"X-Version": this._version,
				},
			},
			{
				onProgress: (progress) => {
					setStatus({ status: "uploading", progress });
				},
				onError: (err) => {
					setStatus({
						status: "error",
						error: `${err.status} ${err.statusText}`,
					});
				},
				onSuccess: () => {
					setStatus({ status: "uploading" });
				},
			},
		);
	}

	private _apiUploadWithProgress(
		path: string,
		options: RequestInit = {},
		handlers: {
			onProgress?: (progress: UploadStatus["progress"]) => void;
			onError?: (err: { status: number; statusText: string }) => void;
			onSuccess?: () => void;
		} = {},
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open(options.method || "POST", `${this._cloudUrl}${path}`);
			xhr.withCredentials = true;

			if (options.headers) {
				Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
					xhr.setRequestHeader(key, value);
				});
			}

			xhr.upload.onloadstart = function (event) {
				if (handlers.onProgress) {
					handlers.onProgress({ current: 0, total: event.total });
				}
			};

			xhr.upload.onprogress = function (event) {
				if (event.lengthComputable && handlers.onProgress) {
					handlers.onProgress({ current: event.loaded, total: event.total });
				}
			};

			xhr.onload = function () {
				if (xhr.status >= 200 && xhr.status < 300) {
					handlers.onSuccess?.();
					resolve(xhr.response);
				} else {
					handlers.onError?.({ status: xhr.status, statusText: xhr.statusText });
					reject(new Error(`Upload error: ${xhr.status} ${xhr.statusText}`));
				}
			};

			xhr.onerror = () => {
				handlers.onError?.({ status: xhr.status, statusText: xhr.statusText });
				reject(new Error(`Network or CORS error. Code: ${xhr.status}, text: ${xhr.statusText}`));
			};

			xhr.onabort = () => {
				handlers.onError?.({ status: xhr.status, statusText: "Aborted" });
				reject(new Error("Upload was cancelled"));
			};

			xhr.send(options.body as XMLHttpRequestBodyInit);
		});
	}
}

export default VersionedCloudApi;
