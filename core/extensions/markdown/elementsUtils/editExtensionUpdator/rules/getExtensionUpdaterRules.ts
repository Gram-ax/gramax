import getArticleRefRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/articleRef";
import getCatalogPropsRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/catalogProps";
import { MutableRefObject } from "react";
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

export const getExtensionUpdaterRules = (
	theme: Theme,
	isMac: boolean,
	articleProps: ClientArticleProps,
	catalogProps: ClientCatalogProps,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
	articleRef: MutableRefObject<HTMLDivElement>,
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
