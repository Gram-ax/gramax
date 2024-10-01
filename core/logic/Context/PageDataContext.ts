import ShareData from "@ext/catalog/actions/share/model/ShareData";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import Theme from "../../extensions/Theme/Theme";
import UiLanguage, { type ContentLanguage } from "../../extensions/localization/core/model/Language";
import UserInfo from "../../extensions/security/logic/User/UserInfo2";
import SourceData from "../../extensions/storage/logic/SourceDataProvider/model/SourceData";

interface PageDataContext {
	language: {
		content: ContentLanguage;
		ui: UiLanguage;
	};
	theme: Theme;
	isLogged: boolean;
	userInfo: UserInfo;
	domain: string;
	sourceDatas: SourceData[];
	isArticle: boolean;
	workspace: {
		workspaces: ClientWorkspaceConfig[];
		current: WorkspacePath;
		defaultPath: WorkspacePath;
		isEnterprise: boolean;
	};
	conf: {
		version: string;
		buildVersion: string;
		basePath: string;
		isRelease: boolean;
		isReadOnly: boolean;
		isServerApp: boolean;
		isProduction: boolean;
		isSsoEnabled: boolean;
		glsUrl: string;
		authServiceUrl: string;
		bugsnagApiKey: string;
		yandexMetricCounter: string;
	};
	shareData?: ShareData;
}

export default PageDataContext;
