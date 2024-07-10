import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { Dispatch, SetStateAction } from "react";

let _flag: boolean;
let _data: ArticlePageData;
let _onUpdate: (data: ArticlePageData) => void;
let _setIsLoading: Dispatch<SetStateAction<boolean>>;

export default abstract class ArticleUpdaterService {
	public static bindData(data: ArticlePageData) {
		_data = data;
	}
	public static bindOnUpdate(onUpdate: typeof _onUpdate) {
		_onUpdate = onUpdate;
	}
	public static bindSetIsLoading(setIsLoading: typeof _setIsLoading) {
		_setIsLoading = setIsLoading;
	}

	public static stopLoadingAfterFocus() {
		_flag = false;
	}

	public static startLoadingAfterFocus() {
		_flag = true;
	}

	public static async update(apiUrlCreator: ApiUrlCreator) {
		if (!_setIsLoading || !_onUpdate) return;
		_setIsLoading(true);
		const data = await ArticleUpdaterService._getUpdateDate(apiUrlCreator);
		_setIsLoading(false);
		if (data && data?.articleProps?.ref?.path == _data.articleProps.ref.path) _onUpdate(data);
	}

	public static setUpdateData(data: ArticlePageData) {
		_onUpdate?.(data);
	}

	private static async _getUpdateDate(apiUrlCreator: ApiUrlCreator): Promise<ArticlePageData> {
		if (!_flag) ArticleUpdaterService.startLoadingAfterFocus();
		else {
			const response = await FetchService.fetch(apiUrlCreator.checkLastModifiedArticle());
			return response && response.ok ? (await response?.json?.()) ?? null : null;
		}
	}
}
