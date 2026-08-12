import type { EnterpriseCloudConfig, EnterpriseConfig, MetricsConfig } from "@app/config/AppConfig";
import type ShareData from "@ext/catalog/actions/share/model/ShareData";
import type { AppSettings } from "@ext/settings/levels/app-settings";
import type { WorkspaceSettings } from "@ext/settings/levels/workspace-settings";
import type { StoredSettings } from "@ext/settings/logic/types";
import type { features } from "@ext/toggleFeatures/features";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { ContentLanguage } from "../../extensions/localization/core/model/Language";
import type UserInfo from "../../extensions/security/logic/User/UserInfo";

// Recursively partial: filterByTarget in the resolver may drop any leaf whose
// target bits don't match the current platform, so consumers must guard with `?.`.
export type ClientSettings =
	| StoredSettings<typeof AppSettings>
	| StoredSettings<typeof AppSettings & typeof WorkspaceSettings>;

interface PageDataContext {
	domain: string;
	isLogged: boolean;
	isArticle: boolean;
	pdfTemplates: string[];
	wordTemplates: string[];
	userInfo: UserInfo;
	language: {
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
		cloudServiceUrl: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isProduction: boolean;
		forceUiLangSync: boolean;
		enterpriseCloud: EnterpriseCloudConfig;
		metrics: MetricsConfig;
		enterprise: EnterpriseConfig;
		activeGesUrl?: string;
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
	settings: ClientSettings;
	appSettings?: StoredSettings<typeof AppSettings>;
	permissions: string;
	shareData?: ShareData;
	features?: (keyof typeof features)[];
}

export default PageDataContext;
