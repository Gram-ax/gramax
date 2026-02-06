import type { EnterpriseConfig, MetricsConfig } from "@app/config/AppConfig";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import type { features } from "@ext/toggleFeatures/features";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type UiLanguage from "../../extensions/localization/core/model/Language";
import type { ContentLanguage } from "../../extensions/localization/core/model/Language";
import type UserInfo from "../../extensions/security/logic/User/UserInfo";
import type Theme from "../../extensions/Theme/Theme";

interface PageDataContext {
	language: {
		content: ContentLanguage;
		ui: UiLanguage;
	};
	theme: Theme;
	isLogged: boolean;
	userInfo: UserInfo;
	domain: string;
	isArticle: boolean;
	isGesUnauthorized?: boolean;
	pdfTemplates: string[];
	wordTemplates: string[];
	workspace: {
		workspaces: ClientWorkspaceConfig[];
		current: WorkspacePath;
		defaultPath: WorkspacePath;
	};
	conf: {
		version: string;
		buildVersion: string;
		basePath: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isProduction: boolean;
		authServiceUrl: string;
		cloudServiceUrl: string;
		diagramsServiceUrl: string;
		bugsnagApiKey: string;
		enterprise: EnterpriseConfig;
		metrics: MetricsConfig;
		logo: {
			imageUrl: string;
			linkUrl: string;
			linkTitle: string;
		};
		ai: {
			enabled: boolean;
		};
		forceUiLangSync: boolean;
	};
	permissions: string;
	shareData?: ShareData;
	features?: (keyof typeof features)[];
}

export default PageDataContext;
