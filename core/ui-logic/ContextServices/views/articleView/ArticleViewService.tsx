import ArticlePage from "@components/ArticlePage/ArticlePage";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import ArticleLoadingView from "@core-ui/ContextServices/views/articleView/ArticleLoadingView";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { createContext, ReactElement, ReactNode, useContext, useEffect, useState } from "react";

type ArticleViewComponent = ({ data }: { data: ArticlePageData }) => ReactNode;

const ArticleViewContext = createContext<ArticleViewComponent>(undefined);
const ArticleViewBottomContext = createContext<ArticleViewComponent>(undefined);
const UseArticleDefaultStylesContext = createContext<boolean>(undefined);
const AdditionalStylesContext = createContext<string>(undefined);

let _setArticleViewComponent: React.Dispatch<React.SetStateAction<ArticleViewComponent>>;
let _setArticleViewBottomComponent: React.Dispatch<React.SetStateAction<ArticleViewComponent>>;
let _setUseArticleDefaultStyles: React.Dispatch<React.SetStateAction<boolean>>;
let _setAdditionalStyles: React.Dispatch<React.SetStateAction<string>>;

abstract class ArticleViewService {
	private static _isDefaultView: boolean = false;
	private static _currentComponent: ArticleViewComponent = null;
	private static _hasInit = false;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isFirstLoad = IsFirstLoadService.value;
		const { isStatic, isStaticCli } = usePlatform();
		const isStaticOrStaticCli = isStatic || isStaticCli;

		if (isStaticOrStaticCli) {
			ArticleViewService._isDefaultView = true;
		}

		const [articleViewComponent, setArticleViewComponent] = useState<ArticleViewComponent>(() =>
			isStaticOrStaticCli ? ArticlePage : null,
		);
		const [articleViewBottomComponent, setArticleViewBottomComponent] = useState<ArticleViewComponent>(null);

		const [useArticleDefaultStyles, setUseArticleDefaultStyles] = useState(true);
		const [additionalStyles, setAdditionalStyles] = useState<string>("");

		_setArticleViewComponent = setArticleViewComponent;
		_setArticleViewBottomComponent = setArticleViewBottomComponent;
		_setUseArticleDefaultStyles = setUseArticleDefaultStyles;
		_setAdditionalStyles = setAdditionalStyles;

		const restoreStateOnReopenCatalog = () => {
			if (!ArticleViewService._hasInit) {
				ArticleViewService._hasInit = true;
				return;
			}

			ArticleViewService._isDefaultView = false;
			ArticleViewService.setDefaultView();
		};

		useWatch(restoreStateOnReopenCatalog, []);

		useEffect(() => {
			if (!isFirstLoad && !ArticleViewService._currentComponent) {
				ArticleViewService.setDefaultView();
			}
		}, [isFirstLoad]);

		return (
			<ArticleViewContext.Provider value={articleViewComponent || ArticleLoadingView}>
				<ArticleViewBottomContext.Provider value={articleViewBottomComponent}>
					<UseArticleDefaultStylesContext.Provider value={useArticleDefaultStyles}>
						<AdditionalStylesContext.Provider value={additionalStyles}>
							{children}
						</AdditionalStylesContext.Provider>
					</UseArticleDefaultStylesContext.Provider>
				</ArticleViewBottomContext.Provider>
			</ArticleViewContext.Provider>
		);
	}

	static get value(): ArticleViewComponent {
		return useContext(ArticleViewContext);
	}

	static getBottomView(): ArticleViewComponent {
		return useContext(ArticleViewBottomContext);
	}

	static get useArticleDefaultStyles(): boolean {
		return useContext(UseArticleDefaultStylesContext);
	}

	static set useArticleDefaultStyles(value: boolean) {
		_setUseArticleDefaultStyles(value);
	}

	static get additionalStyles(): string {
		return useContext(AdditionalStylesContext);
	}

	static setView(component: ArticleViewComponent, useArticleDefaultStyles = true, additionalStyles = "") {
		ArticleViewService._isDefaultView = false;
		ArticleViewService._currentComponent = component;
		_setUseArticleDefaultStyles(useArticleDefaultStyles);
		_setAdditionalStyles(additionalStyles);
		_setArticleViewComponent(() => component);
	}

	static setBottomView(component: ArticleViewComponent) {
		_setArticleViewBottomComponent(() => component);
	}

	static setDefaultBottomView() {
		_setArticleViewBottomComponent(null);
	}

	static setDefaultView() {
		if (ArticleViewService._isDefaultView) return;

		ArticleViewService.setView(ArticlePage);
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
