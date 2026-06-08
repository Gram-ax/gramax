import type Context from "@core/Context/Context";
import type { AppliedCatalogsView } from "@ext/catalog/views/models/CatalogViews";
import type Cookie from "@ext/cookie/Cookie";
import UiLanguage, { ContentLanguage } from "@ext/localization/core/model/Language";
import User from "@ext/security/logic/User/User";
import Theme from "@ext/Theme/Theme";

interface TestContextOptions {
	user?: User;
	contentLanguage?: ContentLanguage;
}

class TestContext implements Context {
	private readonly _user: User;
	private readonly _contentLanguage: ContentLanguage;

	constructor(options: TestContextOptions = {}) {
		this._user = options.user ?? new User();
		this._contentLanguage = options.contentLanguage ?? ContentLanguage.ru;
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
		return this._contentLanguage;
	}

	get domain(): string {
		return "test://";
	}

	get viewId(): AppliedCatalogsView {
		return null;
	}

	toSpan() {
		return "<test ctx>";
	}
}

export default TestContext;
