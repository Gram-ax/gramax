import type { EnterpriseConfig, MetricsConfig } from "@app/config/AppConfig";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import type { features } from "@ext/toggleFeatures/features";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type UiLanguage from "../../extensions/localization/core/model/Language";
import type { ContentLanguage } from "../../extensions/localization/core/model/Language";
import type UserInfo from "../../extensions/security/logic/User/UserInfo";
import type Theme from "../../extensions/Theme/Theme";

interface PageDataContext {
	domain: string;
	isLogged: boolean;
	isArticle: boolean;
	pdfTemplates: string[];
	wordTemplates: string[];
	theme: Theme;
	userInfo: UserInfo;
	language: {
		ui: UiLanguage;
		content: ContentLanguage;
	};
	workspace: {
		current: WorkspacePath;
		defaultPath: WorkspacePath;
		workspaces: ClientWorkspaceConfig[];
	};
	conf: {
		version: string;
		basePath: string;
		buildVersion: string;
		bugsnagApiKey: string;
		authServiceUrl: string;
		cloudServiceUrl: string;
		diagramsServiceUrl: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isProduction: boolean;
		forceUiLangSync: boolean;
		metrics: MetricsConfig;
		enterprise: EnterpriseConfig;
		logo: {
			imageUrl: string;
			linkUrl: string;
			linkTitle: string;
		};
		ai: {
			enabled: boolean;
		};
		search: {
			resourcesEnabled: boolean;
		};
	};
	permissions: string;
	shareData?: ShareData;
	features?: (keyof typeof features)[];
}

export default PageDataContext;
