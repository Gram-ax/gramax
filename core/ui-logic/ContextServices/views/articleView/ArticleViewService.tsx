import ArticlePage from "@components/ArticlePage/ArticlePage";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import ArticleLoadingView from "@core-ui/ContextServices/views/articleView/ArticleLoadingView";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from "react";

type ArticleViewComponent = (data: ArticlePageData) => ReactNode;

const ArticleViewContext = createContext<ReactNode>(undefined);
let _setArticleView: React.Dispatch<React.SetStateAction<ReactNode>>;

const ArticleView: ArticleViewComponent = (data) => <ArticlePage data={data} />;

abstract class ArticleViewService {
	private static _currentComponent: ArticleViewComponent = null;
	private static _articlePageData: ArticlePageData;

	static Provider({
		children,
		articlePageData,
	}: {
		children: ReactElement;
		articlePageData: ArticlePageData;
	}): ReactElement {
		const isFirstLoad = IsFirstLoadService.value;

		const [articleView, setArticleView] = useState<ReactNode>(null);
		_setArticleView = setArticleView;

		const [prevArticlePageData, setPrevArticlePageData] = useState<ArticlePageData>(null);

		if (prevArticlePageData !== articlePageData) {
			ArticleViewService._articlePageData = articlePageData;
			const currentComponent = ArticleViewService._currentComponent
				? ArticleViewService._currentComponent(articlePageData)
				: ArticleLoadingView;

			setArticleView(currentComponent);
			setPrevArticlePageData(articlePageData);
		}

		useEffect(() => {
			if (!isFirstLoad && !ArticleViewService._currentComponent) {
				ArticleViewService.setDefaultView();
			}
		}, [isFirstLoad]);

		return <ArticleViewContext.Provider value={articleView}>{children}</ArticleViewContext.Provider>;
	}

	static get value(): ReactNode {
		return useContext(ArticleViewContext);
	}

	static setView(component: ArticleViewComponent) {
		ArticleViewService._currentComponent = component;
		_setArticleView(component(ArticleViewService._articlePageData));
	}

	static setDefaultView() {
		ArticleViewService.setView(ArticleView);
	}

	static setLoadingView() {
		ArticleViewService.setView(ArticleLoadingView);
	}
}

export default ArticleViewService;
