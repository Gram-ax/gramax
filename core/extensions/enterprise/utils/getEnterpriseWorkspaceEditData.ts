import { usePlatform } from "@core-ui/hooks/usePlatform";
import { EnterpriseWorkspaceEditData } from "@ext/enterprise/components/useEditEnterpriseWorkspace";
import { EnterpriseAuthResult } from "@ext/enterprise/types/EnterpriseAuthResult";
import t from "@ext/localization/locale/translate";

export function getEnterpriseWorkspaceEditData(
	status: EnterpriseAuthResult,
	gesUrl?: string,
): EnterpriseWorkspaceEditData {
	const isTauri = usePlatform();

	switch (status) {
		case EnterpriseAuthResult.Permitted:
			return {
				permitted: true,
				tooltip: undefined,
				href: `${gesUrl}/admin/login`,
				target: isTauri ? "_self" : "_blank",
			};
		case EnterpriseAuthResult.Forbidden:
			return {
				permitted: false,
				tooltip: t("enterprise.edit-workspace.cant-edit"),
			};
		case EnterpriseAuthResult.Error:
			return {
				permitted: false,
				tooltip: t("enterprise.edit-workspace.error-get-edit-info"),
			};
		default:
			return { permitted: false };
	}
}
