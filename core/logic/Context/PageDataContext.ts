import ShareData from "@ext/catalog/actions/share/model/ShareData";
import Theme from "../../extensions/Theme/Theme";
import Language from "../../extensions/localization/core/model/Language";
import UserInfo from "../../extensions/security/logic/User/UserInfo2";
import SourceData from "../../extensions/storage/logic/SourceDataProvider/model/SourceData";

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
		authServiceUrl: string;
		enterpriseServerUrl: string;
		bugsnagApiKey: string;
	};
	shareData?: ShareData;
}

export default PageDataContext;
