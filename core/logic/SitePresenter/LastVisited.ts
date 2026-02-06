import resolveModule from "@app/resolveModule/backend";
import type Context from "@core/Context/Context";
import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";

type LastVisitedDto = { [workspace: string]: { [key: string]: string } };

const LAST_VISITED_COOKIE_NAME = "last-visited-articles";

export default class LastVisited {
	private _cached: LastVisitedDto;

	constructor(
		private _ctx: Context,
		private _workspace: string,
	) {}

	getLastVisitedArticles(): LastVisitedDto {
		if (this._cached) return this._cached;
		const cookieRaw = this._ctx.cookie.get(LAST_VISITED_COOKIE_NAME);

		if (typeof window !== "undefined") {
			const sessionRaw = window.sessionStorage.getItem(LAST_VISITED_COOKIE_NAME);
			const sessionData = sessionRaw ? JSON.parse(sessionRaw) : {};
			const cookieData = cookieRaw ? JSON.parse(cookieRaw) : {};
			this._cached = { ...cookieData, ...sessionData };
		} else {
			this._cached = cookieRaw ? JSON.parse(cookieRaw) : {};
		}

		return this._cached;
	}

	getLastVisitedArticle(catalog: ReadonlyBaseCatalog) {
		return this.getLastVisitedArticles()?.[this._workspace]?.[catalog?.name];
	}

	setLastVisitedArticle(catalog: ReadonlyBaseCatalog, article: ClientArticleProps) {
		if (!catalog || article.errorCode || article.welcome) return;
		const lastVisited = this.getLastVisitedArticles();

		if (typeof lastVisited[this._workspace] !== "object") lastVisited[this._workspace] = {};
		lastVisited[this._workspace][catalog.name] = article.pathname;
		this._save(lastVisited);
	}

	retain(catalogNames: string[]) {
		const lastVisited = this.getLastVisitedArticles();
		const visited = { [this._workspace]: {} };
		const current = typeof lastVisited[this._workspace] === "object" ? lastVisited[this._workspace] : {};

		Object.entries(current).forEach(([k, v]) => catalogNames.includes(k) && (visited[this._workspace][k] = v));
		this._save({ ...lastVisited, ...visited });
	}

	remove(catalogName: string) {
		const lastVisited = this.getLastVisitedArticles();
		delete lastVisited[this._workspace]?.[catalogName];
		this._save(lastVisited);
	}

	clear() {
		this._save({});
	}

	private _save(lastVisited: LastVisitedDto) {
		this._cached = lastVisited;
		const data = JSON.stringify(lastVisited);

		this._ctx.cookie.set(LAST_VISITED_COOKIE_NAME, data);

		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(LAST_VISITED_COOKIE_NAME, data);
			void resolveModule("setSessionData")(LAST_VISITED_COOKIE_NAME, data);
		}
	}
}
