import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import {
	getRulesTableColumns,
	type RuleRow,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/table/StyleGuideRulesContent";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import {
	getRuleBadgeInfo,
	getSingleRuleBadgeInfo,
} from "@ext/enterprise/components/admin/settings/styleGuide/utils/badgeInfoUtil";
import { AlertDeleteDialog } from "@ext/enterprise/components/admin/ui-kit/AlertDeleteDialog";
import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { TableToolbar } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbar";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import { getCoreRowModel, getFilteredRowModel, useReactTable } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useMemo, useState } from "react";

interface StyleGuideRulesTableProps {
	title: string;
	rules: StyleGuideRule[];
	onAdd: () => void;
	onEdit: (guid: string) => void;
	onToggle: (guid: string, enabled: boolean) => Promise<void>;
	onDelete: (guids: string[]) => Promise<void>;
}

export function StyleGuideRulesTable({ title, rules, onEdit, onAdd, onToggle, onDelete }: StyleGuideRulesTableProps) {
	const [rowSelection, setRowSelection] = useState({});

	const tableData = useMemo<RuleRow[]>(
		() =>
			rules.map((rule) => ({
				guid: rule.getModel().guid,
				name: rule.getName(),
				enabled: rule.getModel().enabled ?? true,
				testBadge: getSingleRuleBadgeInfo(rule.getModel().testCases),
				testCases: rule.getModel().testCases,
			})),
		[rules],
	);

	const columns = useMemo(() => getRulesTableColumns({ onToggle }), [onToggle]);

	const table = useReactTable({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			rowSelection,
		},
	});

	const selectedCount = table.getFilteredSelectedRowModel().rows.length;

	const handleDeleteSelectedRules = useCallback(() => {
		const selectedGuids = table.getFilteredSelectedRowModel().rows.map((row) => row.original.guid);
		onDelete(selectedGuids);
		setRowSelection({});
	}, [onDelete, table]);

	const handleFilterChange = useCallback(
		(value: string | null) => {
			table.getColumn("name")?.setFilterValue(value);
		},
		[table],
	);

	return (
		<div>
			<TableInfoBlock
				description={
					getRuleBadgeInfo(rules.map((r) => r.getModel()))?.tooltip ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Counter
									className="rounded-full px-2"
									status={getRuleBadgeInfo(rules.map((r) => r.getModel())).status}
									variant="secondary"
								>
									{getRuleBadgeInfo(rules.map((r) => r.getModel())).label}
								</Counter>
							</TooltipTrigger>
							<TooltipContent>{getRuleBadgeInfo(rules.map((r) => r.getModel()))!.tooltip}</TooltipContent>
						</Tooltip>
					) : (
						<Counter
							className="rounded-full px-2"
							status={getRuleBadgeInfo(rules.map((r) => r.getModel())).status}
							variant="secondary"
						>
							{getRuleBadgeInfo(rules.map((r) => r.getModel())).label}
						</Counter>
					)
				}
				title={title}
			/>
			<div>
				<TableToolbar
					input={
						<TableToolbarTextInput
							onChange={handleFilterChange}
							placeholder={t("enterprise.admin.check.rules-search-placeholder")}
							showClearIcon
							startIcon={<Icon icon="list-filter" />}
							value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
						/>
					}
				>
					<AlertDeleteDialog
						hidden={!selectedCount}
						onConfirm={handleDeleteSelectedRules}
						selectedCount={selectedCount}
					/>
					<TriggerAddButtonTemplate className="px-3" onClick={onAdd} variant="outline" />
				</TableToolbar>

				<TableComponent<RuleRow>
					columns={columns}
					onRowClick={(row) => onEdit(row.original.guid)}
					table={table}
				/>
			</div>
		</div>
	);
}
