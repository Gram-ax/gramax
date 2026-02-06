import { InvalidEmailCell } from "@ext/enterprise/components/admin/settings/components/InvalidEmailCell";
import { REPOSITORY_USER_ROLES, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";

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
					<Select onValueChange={handleValueChange} value={cell.getValue() as RoleId}>
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
							loadMode="auto"
							loadOptions={loadBranchesOptions}
							minInputLength={1}
							onChange={handleBranchesChange}
							placeholder={t("enterprise.admin.resources.branches.placeholder")}
							value={row.original.branches.map((branch) => ({ value: branch, label: branch }))}
						/>
					);
				}
			},
		},
	];

	return [...commonColumns, ...(isExternal ? [] : branchesColumn)];
};

export default getUsersTableColumns;
