import ArticlePage from "@components/ArticlePage/ArticlePage";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import ArticleLoadingView from "@core-ui/ContextServices/views/articleView/ArticleLoadingView";
import useWatch from "@core-ui/hooks/useWatch";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from "react";

type ArticleViewComponent = (data: ArticlePageData) => ReactNode;

const ArticleViewContext = createContext<ReactNode>(undefined);
const UseArticleDefaultStylesContext = createContext<boolean>(undefined);
let _setArticleView: React.Dispatch<React.SetStateAction<ReactNode>>;
let _setUseArticleDefaultStyles: React.Dispatch<React.SetStateAction<boolean>>;

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
		const [useArticleDefaultStyles, setUseArticleDefaultStyles] = useState(true);
		_setArticleView = setArticleView;
		_setUseArticleDefaultStyles = setUseArticleDefaultStyles;

		useWatch(() => {
			ArticleViewService._articlePageData = articlePageData;
			const currentComponent = ArticleViewService._currentComponent
				? ArticleViewService._currentComponent(articlePageData)
				: ArticleLoadingView;

			setArticleView(currentComponent);
		}, [articlePageData]);

		useEffect(() => {
			if (!isFirstLoad && !ArticleViewService._currentComponent) {
				ArticleViewService.setDefaultView();
			}
		}, [isFirstLoad]);

		return (
			<ArticleViewContext.Provider value={articleView}>
				<UseArticleDefaultStylesContext.Provider value={useArticleDefaultStyles}>
					{children}
				</UseArticleDefaultStylesContext.Provider>
			</ArticleViewContext.Provider>
		);
	}

	static get value(): ReactNode {
		return useContext(ArticleViewContext);
	}

	static get useArticleDefaultStyles(): boolean {
		return useContext(UseArticleDefaultStylesContext);
	}

	static setView(component: ArticleViewComponent, useArticleDefaultStyles = true) {
		ArticleViewService._currentComponent = component;
		_setUseArticleDefaultStyles(useArticleDefaultStyles);
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
