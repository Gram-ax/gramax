import {
	TABLE_EDIT_COLUMN_CODE,
	TABLE_SELECT_COLUMN_CODE,
} from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox } from "@ui-kit/Checkbox";
import { Counter } from "@ui-kit/Counter";
import type { ColumnDef } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { Switch } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { RuleExample } from "../../types";

export type RuleRow = {
	guid: string;
	name: string;
	enabled: boolean;
	testBadge: { status: "default" | "success" | "error"; label: string };
	testCases: RuleExample[] | undefined;
};

export const getRulesTableColumns = ({
	onToggle,
}: {
	onToggle: (guid: string, enabled: boolean) => void;
}): ColumnDef<RuleRow>[] => [
	{
		id: TABLE_SELECT_COLUMN_CODE,
		header: ({ table }) => (
			<Checkbox
				aria-label="Select all"
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				aria-label={"Select row"}
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: TABLE_EDIT_COLUMN_CODE,
		cell: () => <Icon className="text-muted" icon="pencil-line" />,
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "name",
		header: t("enterprise.admin.check.rule-name-placeholder"),
		cell: ({ row }) => row.getValue("name"),
	},
	{
		accessorKey: "testBadge",
		header: t("enterprise.admin.check.tests-column-title"),
		cell: ({ row }) => {
			const badge = row.original.testBadge;
			return (
				<Tooltip>
					<TooltipTrigger>
						<Counter status={badge.status} variant="text">
							{badge.label}
						</Counter>
					</TooltipTrigger>
					<TooltipContent>{t("enterprise.admin.check.tests-correct")}</TooltipContent>
				</Tooltip>
			);
		},
	},
	{
		accessorKey: "Enabled",
		header: "",
		cell: ({ row }) => (
			<Switch
				checked={row.original.enabled}
				onCheckedChange={(checked) => onToggle(row.original.guid, checked)}
				size="sm"
			/>
		),
	},
];
