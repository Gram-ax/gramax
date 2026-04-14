import {
	REPOSITORY_GROUPS_ROLES,
	type RoleId,
} from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { ClientAccessGroup } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { GroupSource } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import { getGroupSourceLabel } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/utils/groupUtils";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, type CheckedState } from "@ui-kit/Checkbox";
import { type ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";

const groupsTableColumns: ColumnDef<ClientAccessGroup>[] = [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => {
			const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({
				table,
			});

			return (
				<Checkbox
					aria-label="Select all"
					checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
					onCheckedChange={handleSelectAll}
				/>
			);
		},
		cell: ({ row }) => (
			<Checkbox
				aria-label="Select row"
				checked={row.getIsSelected()}
				disabled={row.original.disabled}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: t("enterprise.admin.resources.groups.group"),
		cell: ({ row }) => <span>{row.original.name ?? row.original.id}</span>,
	},
	{
		id: "source",
		header: t("source"),
		cell: ({ row }) =>
			row.original.source ? (
				<span>{getGroupSourceLabel({ id: row.original.id, source: row.original.source })}</span>
			) : null,
	},
	{
		accessorKey: "role",
		header: t("enterprise.admin.roles.role"),
		cell: ({ table, row, cell }) => {
			const handleValueChange = (value: string) => {
				(
					table.options.meta as {
						onRoleCellChange: (groupId: string, role: RoleId, source: GroupSource) => void;
					}
				)?.onRoleCellChange?.(row.original.id, value as RoleId, row.original.source ?? GroupSource.GX_GROUPS);
			};

			return (
				<Select onValueChange={handleValueChange} value={cell.getValue() as RoleId}>
					<SelectTrigger>
						<SelectValue placeholder={t("enterprise.admin.roles.select")} />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{REPOSITORY_GROUPS_ROLES.map((role) => (
								<SelectItem key={role} value={role}>
									{t(`enterprise.admin.roles.${role}`)}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			);
		},
	},
];

export default groupsTableColumns;
