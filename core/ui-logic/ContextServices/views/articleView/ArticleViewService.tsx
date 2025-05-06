import ArticlePage from "@components/ArticlePage/ArticlePage";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import ArticleLoadingView from "@core-ui/ContextServices/views/articleView/ArticleLoadingView";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { createContext, ReactElement, ReactNode, useContext, useEffect, useLayoutEffect, useState } from "react";

type ArticleViewComponent = (data: ArticlePageData) => ReactNode;

const ArticleViewContext = createContext<ReactNode>(undefined);
const UseArticleDefaultStylesContext = createContext<boolean>(undefined);
let _setArticleView: React.Dispatch<React.SetStateAction<ReactNode>>;
let _setUseArticleDefaultStyles: React.Dispatch<React.SetStateAction<boolean>>;

const DefaultArticleView: ArticleViewComponent = (data) => <ArticlePage data={data} />;

abstract class ArticleViewService {
	private static _currentComponent: ArticleViewComponent = null;
	private static _articlePageData: ArticlePageData;
	private static _isDefaultView: boolean = false;

	static Provider({
		children,
		articlePageData,
	}: {
		children: ReactElement;
		articlePageData: ArticlePageData;
	}): ReactElement {
		const isFirstLoad = IsFirstLoadService.value;
		const { isStatic, isStaticCli } = usePlatform();
		const isStaticOrStaticCli = isStatic || isStaticCli;

		if (isStaticOrStaticCli) {
			ArticleViewService._currentComponent = DefaultArticleView;
			ArticleViewService._isDefaultView = true;
		}

		const [articleView, setArticleView] = useState<ReactNode>(() =>
			isStaticOrStaticCli ? DefaultArticleView(articlePageData) : null,
		);

		const [useArticleDefaultStyles, setUseArticleDefaultStyles] = useState(true);
		_setArticleView = setArticleView;
		_setUseArticleDefaultStyles = setUseArticleDefaultStyles;

		useLayoutEffect(() => {
			if (isStaticOrStaticCli) return;
			setArticleView(ArticleLoadingView());
		}, []);

		useEffect(() => {
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

	static set useArticleDefaultStyles(value: boolean) {
		_setUseArticleDefaultStyles(value);
	}

	static setView(component: ArticleViewComponent, useArticleDefaultStyles = true) {
		ArticleViewService._isDefaultView = false;
		ArticleViewService._currentComponent = component;
		_setUseArticleDefaultStyles(useArticleDefaultStyles);
		_setArticleView(component(ArticleViewService._articlePageData));
	}

	static setDefaultView() {
		if (ArticleViewService._isDefaultView) return;

		ArticleViewService.setView(DefaultArticleView);
		ArticleViewService._isDefaultView = true;
	}

	static setLoadingView() {
		ArticleViewService.setView(ArticleLoadingView);
	}

	static isDefaultView(): boolean {
		return ArticleViewService._isDefaultView;
	}
}

export default ArticleViewService;
