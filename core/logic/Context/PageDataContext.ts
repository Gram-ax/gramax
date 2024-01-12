import Language from "../../extensions/localization/core/model/Language";
import UserInfo from "../../extensions/security/logic/User/UserInfo2";
import SourceData from "../../extensions/storage/logic/SourceDataProvider/model/SourceData";
import Theme from "../../extensions/Theme/Theme";

interface PageDataContext {
	lang: Language;
	theme: Theme;
	isLogged: boolean;
	userInfo: UserInfo;
	domain: string;
	sourceDatas: SourceData[];
	isArticle: boolean;
	conf: {
		version: string;
		basePath: string;
		branch: string;
		isReadOnly: boolean;
		isServerApp: boolean;
		isProduction: boolean;
		ssoServerUrl: string;
		ssoPublicKey: string;
		enterpriseServerUrl: string;
		bugsnagApiKey: string;
	};
}

export default PageDataContext;
