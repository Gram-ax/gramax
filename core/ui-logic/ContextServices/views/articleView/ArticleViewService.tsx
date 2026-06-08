/** biome-ignore-all lint/complexity/noStaticOnlyClass: expected */
import ArticlePage from "@components/ArticlePage/ArticlePage";
import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import ArticleLoadingView from "@core-ui/ContextServices/views/articleView/ArticleLoadingView";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { createContext, type ReactElement, type ReactNode, useContext, useEffect, useState } from "react";

type ArticleViewComponent = ({ data }: { data: ArticlePageData }) => ReactNode;

const ArticleViewContext = createContext<ArticleViewComponent>(undefined);
const ArticleViewBottomContext = createContext<ArticleViewComponent>(undefined);
const UseArticleDefaultStylesContext = createContext<boolean>(undefined);
const AdditionalStylesContext = createContext<string>(undefined);

let SetArticleViewComponent: React.Dispatch<React.SetStateAction<ArticleViewComponent>>;
let SetArticleViewBottomComponent: React.Dispatch<React.SetStateAction<ArticleViewComponent>>;
let SetUseArticleDefaultStyles: React.Dispatch<React.SetStateAction<boolean>>;
let SetAdditionalStyles: React.Dispatch<React.SetStateAction<string>>;

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

		SetArticleViewComponent = setArticleViewComponent;
		SetArticleViewBottomComponent = setArticleViewBottomComponent;
		SetUseArticleDefaultStyles = setUseArticleDefaultStyles;
		SetAdditionalStyles = setAdditionalStyles;

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
		SetUseArticleDefaultStyles(value);
	}

	static get additionalStyles(): string {
		return useContext(AdditionalStylesContext);
	}

	static setView(component: ArticleViewComponent, useArticleDefaultStyles = true, additionalStyles = "") {
		ArticleViewService._isDefaultView = false;
		ArticleViewService._currentComponent = component;
		SetUseArticleDefaultStyles(useArticleDefaultStyles);
		SetAdditionalStyles(additionalStyles);
		SetArticleViewComponent(() => component);
	}

	static setBottomView(component: ArticleViewComponent) {
		SetArticleViewBottomComponent(() => component);
	}

	static setDefaultBottomView() {
		SetArticleViewBottomComponent(null);
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
