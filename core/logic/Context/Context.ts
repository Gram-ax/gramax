import type { ToSpan } from "@ext/loggers/opentelemetry";
import type Cookie from "../../extensions/cookie/Cookie";
import type UiLanguage from "../../extensions/localization/core/model/Language";
import type { ContentLanguage } from "../../extensions/localization/core/model/Language";
import type User from "../../extensions/security/logic/User/User";
import type Theme from "../../extensions/Theme/Theme";

interface Context extends ToSpan {
	get cookie(): Cookie;
	get user(): User;
	get contentLanguage(): ContentLanguage;
	get ui(): UiLanguage;
	get theme(): Theme;
	get domain(): string;
}

export default Context;
