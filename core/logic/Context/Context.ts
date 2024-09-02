import Cookie from "../../extensions/cookie/Cookie";
import UiLanguage, { type ContentLanguage } from "../../extensions/localization/core/model/Language";
import User from "../../extensions/security/logic/User/User";
import Theme from "../../extensions/Theme/Theme";

interface Context {
	get cookie(): Cookie;
	get user(): User;
	get contentLanguage(): ContentLanguage;
	get ui(): UiLanguage;
	get theme(): Theme;
	get domain(): string;
}

export default Context;
