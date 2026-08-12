import { userColumn, userColumnId } from "@ext/enterprise/components/admin/settings/members/config/userColumn";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";

export const guestColumnId = userColumnId;

export interface UserColumnOptions<T> {
	header?: string;
	getName: (row: T) => string;
}

export const guestColumn = <T,>({ getName, header }: UserColumnOptions<T>): ColumnDef<T> =>
	userColumn({
		getName,
		header: header ?? t("email"),
		showBadges: false,
	});
