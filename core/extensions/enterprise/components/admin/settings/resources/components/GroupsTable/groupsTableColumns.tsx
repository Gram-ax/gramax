import { REPOSITORY_GROUPS_ROLES, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { ClientAccessGroup } from "@ext/enterprise/components/admin/settings/resources/types/ResourcesComponent";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
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
					checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
					onCheckedChange={handleSelectAll}
					aria-label="Select all"
				/>
			);
		},
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				disabled={row.original.disabled}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: t("enterprise.admin.resources.groups.group"),
		cell: ({ row }) => row.original.name ?? row.original.id,
	},
	{
		accessorKey: "role",
		header: t("enterprise.admin.roles.role"),
		cell: ({ table, row, cell }) => {
			const handleValueChange = (value: string) => {
				(table.options.meta as any)?.onRoleCellChange?.(row.original.id, value as RoleId);
			};

			return (
				<Select value={cell.getValue() as RoleId} onValueChange={handleValueChange}>
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
