import getArticleRefRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/articleRef";
import getCatalogPropsRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/catalogProps";
import { MutableRefObject } from "react";
import PageDataContext from "../../../../../logic/Context/PageDataContext";
import { ClientArticleProps, ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import Theme from "../../../../Theme/Theme";
import ExtensionUpdaterRules from "./ExtensionUpdaterRules";
import getApiUrlCreatorRule from "./extensionRules/ruleApiUrlCreator";
import getArticlePropsRule from "./extensionRules/articleProps";
import isMacInfoRule from "./extensionRules/isMac";
import getPageDataContextRule from "./extensionRules/pageDataContext";
import getThemeRule from "./extensionRules/theme";
import getResourceServiceRule from "./extensionRules/resourceService";
import { Environment } from "@app/resolveModule/env";
import getPlatformRule from "./extensionRules/platform";
import getSourceDataRule from "./extensionRules/sourceData";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";

export const getExtensionUpdaterRules = (
	theme: Theme,
	isMac: boolean,
	articleProps: ClientArticleProps,
	catalogProps: ClientCatalogProps,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
	articleRef: MutableRefObject<HTMLDivElement>,
	resourceService: ResourceServiceType,
	platform: Environment,
	sourceData: SourceData[],
): ExtensionUpdaterRules[] => {
	return [
		getThemeRule(theme),
		isMacInfoRule(isMac),
		getArticlePropsRule(articleProps),
		getCatalogPropsRule(catalogProps),
		getApiUrlCreatorRule(apiUrlCreator),
		getPageDataContextRule(pageDataContext),
		getArticleRefRule(articleRef),
		getResourceServiceRule(resourceService),
		getPlatformRule(platform),
		getSourceDataRule(sourceData),
	];
};
