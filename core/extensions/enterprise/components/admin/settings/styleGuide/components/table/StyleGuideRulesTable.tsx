import {
	getRulesTableColumns,
	type RuleRow,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/table/StyleGuideRulesContent";
import type { StyleGuideRule } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideRuleAdapter";
import {
	getRuleBadgeInfo,
	getSingleRuleBadgeInfo,
} from "@ext/enterprise/components/admin/settings/styleGuide/utils/badgeInfoUtil";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { DeleteSelectedButton } from "@ext/enterprise/components/admin/ui-kit/DeleteSelectedButton";
import { SelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/SelectableTable";
import { TableInfoBlock } from "@ext/enterprise/components/admin/ui-kit/table/TableInfoBlock";
import { useRowSelectionWithData } from "@ext/enterprise/components/admin/ui-kit/table/useRowSelection";
import { Counter } from "@ui-kit/Counter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useMemo } from "react";

const getRuleRowId = (row: RuleRow) => row.guid;

interface StyleGuideRulesTableProps {
	title: string;
	rules: StyleGuideRule[];
	onAdd: () => void;
	onEdit: (guid: string) => void;
	onToggle: (guid: string, enabled: boolean) => Promise<void>;
	onDelete: (guids: string[]) => Promise<void>;
}

export function StyleGuideRulesTable({ title, rules, onEdit, onAdd, onToggle, onDelete }: StyleGuideRulesTableProps) {
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

	const badge = useMemo(() => getRuleBadgeInfo(rules.map((r) => r.getModel())), [rules]);

	const { rowSelection, setRowSelection, selectedRows } = useRowSelectionWithData(tableData, getRuleRowId);

	return (
		<div>
			<TableInfoBlock
				description={
					badge.tooltip ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<Counter className="font-medium" size="lg" status={badge.status} variant="text">
									{badge.label}
								</Counter>
							</TooltipTrigger>
							<TooltipContent className="font-sans font-normal">{badge.tooltip}</TooltipContent>
						</Tooltip>
					) : (
						<Counter className="font-medium" size="lg" status={badge.status} variant="text">
							{badge.label}
						</Counter>
					)
				}
				title={title}
			/>
			<SelectableTable<RuleRow>
				className="mt-4"
				columns={columns}
				data={tableData}
				getRowId={getRuleRowId}
				onRowClick={(row) => onEdit(row.guid)}
				onRowSelectionChange={setRowSelection}
				rowSelection={rowSelection}
				searchColumnId="name"
				toolbarActions={
					<>
						<DeleteSelectedButton
							count={selectedRows.length}
							onClick={() => void onDelete(selectedRows.map((row) => row.guid))}
						/>
						<AddButton onClick={onAdd} />
					</>
				}
			/>
		</div>
	);
}
