import { TableComponent } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import { TableToolbarTextInput } from "@ext/enterprise/components/admin/ui-kit/table/TableToolbarTextInput";
import { useSelectableTable } from "@ext/enterprise/components/admin/ui-kit/table/useSelectableTable";
import t from "@ext/localization/locale/translate";
import type { ColumnDef, Row, RowSelectionState } from "@ui-kit/DataTable";
import { type ReactNode, useCallback } from "react";

interface SelectableTableProps<T> {
	data: T[];
	columns: ColumnDef<T>[];
	getRowId: (row: T) => string;
	onRowClick?: (row: T) => void;
	searchPlaceholder?: string;
	searchColumnId?: string;
	onSearchChange?: (value: string) => void;
	toolbarActions?: ReactNode;
	toolbarLeftActions?: ReactNode;
	className?: string;
	onBottomReached?: () => void;
	isLoading?: boolean;
	isLoadingMore?: boolean;
	sortable?: boolean;
	rowSelection: RowSelectionState;
	onRowSelectionChange: (value: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
	rowVersions?: Map<string, number>;
}

export const SelectableTable = <T,>(props: SelectableTableProps<T>) => {
	const {
		onRowClick,
		searchPlaceholder,
		searchColumnId,
		onSearchChange,
		toolbarActions,
		toolbarLeftActions,
		className,
		onBottomReached,
		isLoading,
		isLoadingMore,
		sortable = true,
		rowVersions,
		rowSelection,
	} = props;

	const { table, allColumns, searchValue, handleSearchChange } = useSelectableTable(props);

	const isServerSearch = Boolean(onSearchChange);
	const showSearchInput = isServerSearch || Boolean(searchColumnId);

	const onRowClickWrap = useCallback((row: Row<T>) => onRowClick?.(row.original), [onRowClick]);

	const toolbarInput = showSearchInput ? (
		<TableToolbarTextInput
			onChange={handleSearchChange}
			placeholder={searchPlaceholder ?? t("enterprise.admin.search")}
			value={searchValue}
		/>
	) : undefined;
	const hasToolbar = Boolean(toolbarInput) || Boolean(toolbarActions);

	return (
		<div className={className}>
			{hasToolbar && (
				<div className={"flex items-center gap-3 py-4 pt-0"}>
					{toolbarInput && (
						<div className="flex gap-3 flex-1 min-w-0">
							{toolbarInput}
							{toolbarLeftActions}
						</div>
					)}
					<div className="flex items-center gap-3 flex-shrink-0 ml-auto">{toolbarActions}</div>
				</div>
			)}
			<TableComponent<T>
				columns={allColumns}
				isLoading={isLoading}
				isLoadingMore={isLoadingMore}
				onBottomReached={onBottomReached}
				onRowClick={onRowClickWrap}
				rowSelection={rowSelection}
				rowVersions={rowVersions}
				sortable={sortable}
				table={table}
			/>
			{isLoadingMore && (
				<p className="mt-2 text-xs text-muted-foreground animate-pulse">{t("enterprise.admin.loading-more")}</p>
			)}
		</div>
	);
};
