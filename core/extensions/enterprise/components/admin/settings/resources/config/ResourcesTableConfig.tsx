import {
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox, CheckedState } from "@ui-kit/Checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { ResourceItem } from "../types/ResourcesComponent";

export const resourcesTableColumns: ColumnDef<ResourceItem>[] = [
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
				checked: row.getIsSelected(),
				onCheckedChange: (value: boolean) => row.toggleSelected(!!value),
				"aria-label": "Select row",
			};

			if (row.original.disabled) {
				return (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Checkbox {...checkboxProps} disabled={true} />
							</TooltipTrigger>
							<TooltipContent>
								<p>{t("enterprise.admin.resources.base-repository-alert")}</p>
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
		accessorKey: "id",
		header: t("enterprise.admin.resources.repository"),
	},
];
