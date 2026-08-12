import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import type { ColumnDef } from "@ui-kit/DataTable";
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
		accessorKey: "name",
		header: t("enterprise.admin.check.rule-name-placeholder"),
		cell: ({ row }) => row.getValue("name"),
	},
	{
		accessorKey: "testBadge",
		header: t("enterprise.admin.tests"),
		cell: ({ row }) => {
			const badge = row.original.testBadge;
			return (
				<Tooltip>
					<TooltipTrigger>
						<Counter status={badge.status} variant="text">
							{badge.label}
						</Counter>
					</TooltipTrigger>
					<TooltipContent className="font-sans font-normal">
						{t("enterprise.admin.check.tests-correct")}
					</TooltipContent>
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
		size: 52,
	},
];
