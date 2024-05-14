import ArticlePage from "@components/ArticlePage/ArticlePage";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from "react";

const ArticleViewContext = createContext<ReactNode>(undefined);
let _setArticleView: React.Dispatch<React.SetStateAction<ReactNode>>;
let _articlePageData: ArticlePageData;

const initFunc = () => <ArticlePage data={_articlePageData} />;

abstract class ArticleViewService {
	private static _currentComponent: (data: ArticlePageData) => ReactNode = initFunc;

	static Provider({
		children,
		articlePageData,
	}: {
		children: ReactElement;
		articlePageData: ArticlePageData;
	}): ReactElement {
		_articlePageData = articlePageData;
		const [articleView, setArticleView] = useState<ReactNode>(null);
		_setArticleView = setArticleView;

		useEffect(() => {
			setArticleView(ArticleViewService._currentComponent(articlePageData));
		}, [articlePageData]);

		return <ArticleViewContext.Provider value={articleView}>{children}</ArticleViewContext.Provider>;
	}

	static get value(): ReactNode {
		return useContext(ArticleViewContext);
	}

	static setView(component: (data: ArticlePageData) => ReactNode) {
		ArticleViewService._currentComponent = component;
		_setArticleView(component(_articlePageData));
	}

	static setDefaultView() {
		ArticleViewService._currentComponent = initFunc;
		_setArticleView(initFunc());
	}
}

export default ArticleViewService;
