import type { EditArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

class ArticleUpdater {
	private _onUpdate: (data: EditArticlePageData) => void;

	bindOnUpdate(onUpdate: (data: EditArticlePageData) => void) {
		this._onUpdate = onUpdate;
	}

	async update(apiUrlCreator: ApiUrlCreator) {
		if (!this._onUpdate) return;
		const data = await this._getUpdateDate(apiUrlCreator);
		if (data) this._onUpdate?.(data);
	}

	private async _getUpdateDate(apiUrlCreator: ApiUrlCreator) {
		const response = await FetchService.fetch(apiUrlCreator.getCurrentArticlePageData());
		return response?.ok ? ((await response.json?.()) ?? null) : null;
	}
}

/** @deprecated use useArticlePropsStore.update instead */
const ArticleUpdaterService = new ArticleUpdater();

export default ArticleUpdaterService;
