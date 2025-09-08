import { EnterpriseConfig, type MetricsConfig } from "@app/config/AppConfig";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import type { features } from "@ext/toggleFeatures/features";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import Theme from "../../extensions/Theme/Theme";
import UiLanguage, { type ContentLanguage } from "../../extensions/localization/core/model/Language";
import UserInfo from "../../extensions/security/logic/User/UserInfo";

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
		search?: {
			elastic: { enabled: boolean };
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
