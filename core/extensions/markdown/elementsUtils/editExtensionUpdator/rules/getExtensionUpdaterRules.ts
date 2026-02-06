import type { Environment } from "@app/resolveModule/env";
import type { ResourceServiceType } from "@ext/markdown/elements/copyArticles/resourceService";
import getArticleRefRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/articleRef";
import getCatalogPropsRule from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/extensionRules/catalogProps";
import type SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import type { MutableRefObject } from "react";
import type PageDataContext from "../../../../../logic/Context/PageDataContext";
import type { ClientArticleProps, ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import type ApiUrlCreator from "../../../../../ui-logic/ApiServices/ApiUrlCreator";
import type Theme from "../../../../Theme/Theme";
import type ExtensionUpdaterRules from "./ExtensionUpdaterRules";
import getArticlePropsRule from "./extensionRules/articleProps";
import isMacInfoRule from "./extensionRules/isMac";
import getPageDataContextRule from "./extensionRules/pageDataContext";
import getPlatformRule from "./extensionRules/platform";
import getResourceServiceRule from "./extensionRules/resourceService";
import getApiUrlCreatorRule from "./extensionRules/ruleApiUrlCreator";
import getSourceDataRule from "./extensionRules/sourceData";
import getThemeRule from "./extensionRules/theme";

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
