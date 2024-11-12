import Context from "@core/Context/Context";
import Theme from "@ext/Theme/Theme";
import Cookie from "@ext/cookie/Cookie";
import UiLanguage, { ContentLanguage } from "@ext/localization/core/model/Language";
import User from "@ext/security/logic/User/User";

class TestContext implements Context {
	private readonly _user: User;

	constructor() {
		this._user = new User();
	}

	get cookie(): Cookie {
		throw new Error("Method not implemented.");
	}

	get user(): User {
		return this._user;
	}

	get ui() {
		return UiLanguage.ru;
	}

	get theme(): Theme {
		return Theme.dark;
	}

	get contentLanguage(): ContentLanguage {
		return ContentLanguage.ru;
	}

	get domain(): string {
		return "test://";
	}
}

export default TestContext;
