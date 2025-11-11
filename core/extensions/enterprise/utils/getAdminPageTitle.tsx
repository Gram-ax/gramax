import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
export function getAdminPageTitle(page: Page): string {
	return t(`enterprise.admin.pages.${page}`);
}
