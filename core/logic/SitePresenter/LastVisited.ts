import type Context from "@core/Context/Context";
import type { ReadonlyBaseCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
const LAST_VISITED_COOKIE_NAME = "last-visited";

export default class LastVisited {
	private _cached: { [key: string]: string };

	constructor(private _ctx: Context) {}

	getLastVisitedArticles(): { [key: string]: string } {
		if (this._cached) return this._cached;
		const json = this._ctx.cookie.get(LAST_VISITED_COOKIE_NAME);
		this._cached = json ? JSON.parse(json) : {};
		return this._cached;
	}

	getLastVisitedArticle(catalog: ReadonlyBaseCatalog) {
		return this.getLastVisitedArticles()?.[catalog?.name];
	}

	setLastVisitedArticle(catalog: ReadonlyBaseCatalog, article: ClientArticleProps) {
		if (!catalog || article.errorCode || article.welcome) return;
		const lastVisited = this.getLastVisitedArticles();
		lastVisited[catalog.name] = article.pathname;
		this._ctx.cookie.set(LAST_VISITED_COOKIE_NAME, JSON.stringify(lastVisited));
	}

	retain(catalogNames: string[]) {
		const lastVisited = this.getLastVisitedArticles();
		const visited = {};
		Object.entries(lastVisited).forEach(([k, v]) => catalogNames.includes(k) && (visited[k] = v));
		this._cached = visited;
		this._ctx.cookie.set(LAST_VISITED_COOKIE_NAME, JSON.stringify(this._cached));
	}

	remove(catalogName: string) {
		const lastVisited = this.getLastVisitedArticles();
		delete lastVisited[catalogName];
		this._cached = lastVisited;
		this._ctx.cookie.set(LAST_VISITED_COOKIE_NAME, JSON.stringify(lastVisited));
	}
}
