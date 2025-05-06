import { DOMAIN } from "../../../utils/predefinedValues";
import { ArticleItem } from "./entities/article";

class FetchActions {
	private _headers = {
		accept: "application/json, text/plain, */*",
		"accept-language": "ru",
		"cache-control": "no-cache",
		"content-type": "application/json",
		pragma: "no-cache",
		priority: "u=1, i",
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		"x-collab-org-id": "",
		"x-csrf-token": "",
		"x-org-id": "",
		cookie: "",
		"Referrer-Policy": "strict-origin-when-cross-origin",
	};

	private _fileHeaders = {
		accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
		"accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
		"cache-control": "max-age=0",
		priority: "u=0, i",
		"sec-fetch-dest": "document",
		"sec-fetch-mode": "navigate",
		"sec-fetch-site": "none",
		"sec-fetch-user": "?1",
		"upgrade-insecure-requests": "1",
		cookie: "",
	};

	init(headers: any) {
		this._headers["x-collab-org-id"] = headers["x-collab-org-id"];
		this._headers["x-csrf-token"] = headers["x-csrf-token"];
		this._headers["x-org-id"] = headers["x-org-id"];
		this._headers["cookie"] = headers["cookie"];

		this._fileHeaders["cookie"] = headers["cookie"];
	}

	async getArticleBySlug(slug: string): Promise<ArticleItem> {
		const body = {
			slug: slug,
			fields: ["breadcrumbs", "content", "attributes"],
			raiseOnRedirect: true,
			settings: { lang: "ru", theme: "system" },
		};

		const res = await fetch(DOMAIN + ".gateway/root/wiki/getPageDetails", {
			headers: this._headers as any,
			body: JSON.stringify(body),
			method: "POST",
		});

		if (!res.ok) throw new Error(`Error receiving the article; status: ${res.status}; text: ${res.statusText}`);

		return res.json();
	}

	async downloadFile(fileUrl: string) {
		const res = await fetch(DOMAIN + fileUrl, {
			headers: this._fileHeaders as any,
			referrerPolicy: "strict-origin-when-cross-origin",
			body: null,
			method: "GET",
		});

		if (!res.ok) {
			throw new Error(`Error receiving the article; status:${res.status}, statusText: ${res.statusText}`);
		}

		return res.body;
	}

	async getNavTreeNode(parentSlug: string, breadcrumbsBranchSlug?: string) {
		const body = {
			parentSlug,
			breadcrumbsBranchSlug,
		};

		const res = await fetch(DOMAIN + ".gateway/root/wiki/openNavigationTreeNode", {
			headers: this._headers as any,
			body: JSON.stringify(body),
			method: "POST",
		});

		if (!res.ok) throw new Error(`Error receiving navigation; status: ${res.status}; text: ${res.statusText}`);

		return res.json();
	}
}

export default new FetchActions();
