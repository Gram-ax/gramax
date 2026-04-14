import t from "@ext/localization/locale/translate";
import { Page } from "../types/Page";

export function getAdminPageTitle(page: Page): string {
	switch (page) {
		case Page.STYLEGUIDE:
			return t("enterprise.admin.pages.check");
		default:
			return t(`enterprise.admin.pages.${page}`);
	}
}
