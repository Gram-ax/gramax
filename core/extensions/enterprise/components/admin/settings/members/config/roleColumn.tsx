import type { RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { RolePicker } from "@ext/enterprise/components/admin/settings/members/components/RolePicker";
import type { RoleRules, RoleValue } from "@ext/enterprise/components/admin/settings/members/model/roleRules";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";

export interface RoleColumnOptions<T> {
	getRules: (row: T) => RoleRules;
	getValue: (row: T) => RoleValue | undefined;
	onChange: (row: T, role: RoleId) => void;
	isDisabled?: (row: T) => boolean;
}

export const roleColumn = <T,>({ getRules, getValue, onChange, isDisabled }: RoleColumnOptions<T>): ColumnDef<T> => ({
	id: "role",
	accessorFn: (row: T) => getValue(row),
	header: t("enterprise.admin.roles.role"),
	size: 200,
	cell: ({ row }) => {
		const item = row.original;
		return (
			<RolePicker
				disabled={isDisabled?.(item) ?? false}
				onChange={(role) => onChange(item, role)}
				rules={getRules(item)}
				value={getValue(item)}
			/>
		);
	},
});
