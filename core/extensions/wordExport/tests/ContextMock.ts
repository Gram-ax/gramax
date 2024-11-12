import { getConfig } from "@app/config/AppConfig";
import Context from "@core/Context/Context";
import UiLanguage, { ContentLanguage } from "@ext/localization/core/model/Language";
import AllPermission from "@ext/security/logic/Permission/AllPermission";
import User from "@ext/security/logic/User/User";
import Theme from "@ext/Theme/Theme";
import CookieMock from "@ext/wordExport/tests/CookieMock";

const ctx: Context = {
	get cookie() {
		return new CookieMock(getConfig().tokens.cookie);
	},
	get user() {
		return new User(null, null, new AllPermission());
	},
	get contentLanguage() {
		return ContentLanguage.ru;
	},
	get ui() {
		return UiLanguage.ru;
	},
	get theme() {
		return Theme.dark;
	},
	get domain() {
		return "";
	},
};

export default ctx;
