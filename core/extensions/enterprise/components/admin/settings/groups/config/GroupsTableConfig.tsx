import {
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, type CheckedState } from "@ui-kit/Checkbox";
import { type ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import type { Group } from "../types/GroupsComponentTypes";

export const groupTableColumns: ColumnDef<Group>[] = [
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
		cell: ({ row }) => {
			const checkboxProps = {
				"aria-label": "Select row",
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
			};

			if (row.original.disabled) {
				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Checkbox {...checkboxProps} disabled={true} />
							</TooltipTrigger>
							<TooltipContent>
								<p>{row.original.disabledTooltip}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			}

			return <Checkbox {...checkboxProps} />;
		},
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: TABLE_EDIT_COLUMN_CODE,
		cell: () => <Icon className="text-muted" icon="pen" />,
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "group",
		header: t("enterprise.admin.resources.groups.group"),
	},
];
