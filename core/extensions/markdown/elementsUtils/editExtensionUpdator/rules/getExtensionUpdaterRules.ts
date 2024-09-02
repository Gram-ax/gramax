import getCatalogPropsRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/catalogProps";
import PageDataContext from "../../../../../logic/Context/PageDataContext";
import { ClientArticleProps, ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import Theme from "../../../../Theme/Theme";
import ExtensionUpdaterRules from "./ExtensionUpdaterRules";
import getApiUrlCreatorRule from "./extensionRules/apiUrlCreator";
import getArticlePropsRule from "./extensionRules/articleProps";
import isMacInfoRule from "./extensionRules/isMac";
import getPageDataContextRule from "./extensionRules/pageDataContext";
import getThemeRule from "./extensionRules/theme";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getArticleRefRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/articleRef";

export const getExtensionUpdaterRules = (
	theme: Theme,
	isMac: boolean,
	articleProps: ClientArticleProps,
	catalogProps: ClientCatalogProps,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
	articleRef: ArticleRefService,
): ExtensionUpdaterRules[] => {
	return [
		getThemeRule(theme),
		isMacInfoRule(isMac),
		getArticlePropsRule(articleProps),
		getCatalogPropsRule(catalogProps),
		getApiUrlCreatorRule(apiUrlCreator),
		getPageDataContextRule(pageDataContext),
		getArticleRefRule(articleRef),
	];
};
