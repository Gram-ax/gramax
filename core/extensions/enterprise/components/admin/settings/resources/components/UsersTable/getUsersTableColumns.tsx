import { REPOSITORY_USER_ROLES, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";

export type UsersTableColumn = {
	value: string;
	role: RoleId;
	disabled?: boolean;
	branches?: string[];
};

const getUsersTableColumns = (isExternal: boolean): ColumnDef<UsersTableColumn>[] => {
	const commonColumns: ColumnDef<UsersTableColumn>[] = [
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
			accessorKey: "value",
			header: t("enterprise.admin.resources.users.user"),
			cell: ({ row }) => {
				return <InvalidEmailCell value={row.original.value} />;
			},
		},
		{
			accessorKey: "role",
			header: t("enterprise.admin.roles.role"),
			cell: ({ table, row, cell }) => {
				if (isExternal) return <span>{t(`enterprise.admin.roles.${row.original.role}`)}</span>;

				const handleValueChange = (value: string) => {
					(table.options.meta as any)?.onRoleCellChange?.(row.original.value, value as RoleId);
				};

				return (
					<Select value={cell.getValue() as RoleId} onValueChange={handleValueChange}>
						<SelectTrigger>
							<SelectValue placeholder={t("enterprise.admin.roles.select")} />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{REPOSITORY_USER_ROLES.map((role) => (
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

	const branchesColumn: ColumnDef<UsersTableColumn>[] = [
		{
			accessorKey: "branches",
			header: t("enterprise.admin.resources.branches.branches"),
			cell: ({ table, row }) => {
				const isExternal = (table.options.meta as any)?.isExternal;
				if (isExternal) return <span>-</span>;

				const role = row.getValue<RoleId>("role");
				if (!role || role !== "reviewer") return <span>-</span>;

				const loadBranchesOptions = (table.options.meta as any)?.loadBranchesOptions;
				const handleBranchesChange = (options: SearchSelectOption[]) => {
					const branchValues = options.map((option) => String(option.value));
					(table.options.meta as any)?.onBranchesCellChange?.(row.original.value, branchValues);
				};

				if (role === "reviewer") {
					return (
						<MultiSelect
							loadOptions={loadBranchesOptions}
							value={row.original.branches.map((branch) => ({ value: branch, label: branch }))}
							onChange={handleBranchesChange}
							loadMode="auto"
							minInputLength={1}
							placeholder={t("enterprise.admin.resources.branches.placeholder")}
						/>
					);
				}
			},
		},
	];

	return [...commonColumns, ...(isExternal ? [] : branchesColumn)];
};

export default getUsersTableColumns;
