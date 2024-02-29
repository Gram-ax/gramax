import PageDataContext from "../../../../../logic/Context/PageDataContext";
import { ClientArticleProps } from "../../../../../logic/SitePresenter/SitePresenter";
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
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
): ExtensionUpdaterRules[] => {
	return [
		getThemeRule(theme),
		isMacInfoRule(isMac),
		getArticlePropsRule(articleProps),
		getApiUrlCreatorRule(apiUrlCreator),
		getPageDataContextRule(pageDataContext),
	];
};
