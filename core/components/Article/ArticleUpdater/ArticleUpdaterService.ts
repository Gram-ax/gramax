import type { ArticlePageData, EditArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

type ArticlePageDataResponse = {
	data?: ArticlePageData | null;
};

class ArticleUpdater {
	private _onUpdate: (data: EditArticlePageData) => void;
	private _listeners = new Set<(data: EditArticlePageData) => void>();

	bindOnUpdate(onUpdate: (data: EditArticlePageData) => void) {
		this._onUpdate = onUpdate;
	}

	onUpdated(listener: (data: EditArticlePageData) => void) {
		this._listeners.add(listener);
		return () => this._listeners.delete(listener);
	}

	async update(apiUrlCreator: ApiUrlCreator) {
		if (!this._onUpdate) return;
		const data = await this._getUpdateDate(apiUrlCreator);
		if (!data) return;

		this._onUpdate?.(data);
		this._listeners.forEach((listener) => listener(data));
	}

	private async _getUpdateDate(apiUrlCreator: ApiUrlCreator): Promise<EditArticlePageData | null> {
		const response = await FetchService.fetch(apiUrlCreator.getArticlePageData());
		if (!response?.ok) return null;
		const body = (await response.json?.()) as { data?: EditArticlePageData } | null;
		return body?.data ?? null;
	}
}

const ArticleUpdaterService = new ArticleUpdater();

export default ArticleUpdaterService;
