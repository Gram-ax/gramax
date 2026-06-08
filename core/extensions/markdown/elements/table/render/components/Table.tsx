import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import ColGroup, { type ColInfo } from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import type { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import modifyChildren from "@ext/markdown/elements/table/print/modifyChildren";
import PrintColGroup from "@ext/markdown/elements/table/print/PrintColGroup";
import filterAndSortModifyChildren from "@ext/markdown/elements/table/render/components/FilterAndSort/filterAndSortModifyChildren";
import { TablePropsProvider } from "@ext/markdown/elements/table/render/components/FilterAndSort/TablePropsProvider";
import { useFilterAndSortRender } from "@ext/markdown/elements/table/render/components/FilterAndSort/useFilterAndSortRender";
import TableWrapper from "@ext/markdown/elements/table/render/components/TableWrapper";

import { type ReactElement, useLayoutEffect, useMemo, useRef, useState } from "react";

interface TableProps {
	children?: ReactElement;
	header?: TableHeaderTypes;
	isPrint?: boolean;
	sortingOrder?: number[];
}

const Table = (props: TableProps): ReactElement => {
	const { children, header, isPrint } = props;
	const ref = useRef<HTMLTableElement>(null);

	const [isEnabledWrapper, setIsEnabledWrapper] = useState(false);
	const tableChildren = useMemo(
		() => (isPrint ? modifyChildren : filterAndSortModifyChildren)(children, header),
		[isPrint, children, header],
	);

	const firstRow = Array.isArray(tableChildren) ? tableChildren[0] : tableChildren;
	const [modifiedChildren, setModifiedChildren] = useState(
		Array.isArray(tableChildren) ? tableChildren.slice(1) : undefined,
	);

	useAggregation(ref);

	const colInfo: ColInfo[] = useMemo(() => {
		const firstRowChildren = firstRow?.props?.children;
		if (!firstRowChildren) return [];

		const cells = Array.isArray(firstRowChildren) ? firstRowChildren : [firstRowChildren];
		if (!cells.some((cell: ReactElement) => cell.props.colwidth)) return [];

		return cells.map((cell: ReactElement) => {
			const colwidth = cell.props.colwidth;
			const colspan = parseInt(cell.props.colspan || "1", 10);
			return { colspan, colwidth };
		});
	}, [firstRow]);

	const printColGroupData = isPrint && firstRow ? PrintColGroup({ firstRow }) : null;

	const ColGroupComponent = isPrint ? (
		printColGroupData?.colgroup
	) : (
		<ColGroup init={{ colInfo: colInfo || [] }} tableRef={ref} />
	);

	const table = (
		<table
			data-focusable="true"
			data-header={header}
			ref={ref}
			style={
				isPrint
					? {
							maxWidth: printColGroupData?.totalTableWidth || "unset",
							display: "table",
						}
					: {}
			}
		>
			{ColGroupComponent}
			<tbody>
				{firstRow}
				{modifiedChildren}
			</tbody>
		</table>
	);

	if (isPrint) {
		return (
			<div data-component="table" style={{ padding: "1.5em 0" }}>
				{table}
			</div>
		);
	}

	const headerRowRef = useRef<HTMLTableRowElement | null>(null);

	const filterAndSortProps = useFilterAndSortRender(
		header,
		ref,
		{ headerRow: firstRow, rowsArray: modifiedChildren || [] },
		setModifiedChildren,
		props.sortingOrder,
	);
	const { active, tableData } = filterAndSortProps;

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const wrapper = el.closest('[data-wrapper="table"]');
		setIsEnabledWrapper(wrapper?.parentElement?.parentElement?.parentElement?.nodeName === "ARTICLE");
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		if (!ref.current) return;
		const el = ref.current.querySelector<HTMLTableRowElement>(":scope > tbody > tr:first-of-type");
		if (el !== headerRowRef.current) {
			headerRowRef.current = el;
		}
	}, [modifiedChildren]);

	return (
		<StickyTableWrapper
			data-wrapper="table"
			disableWrapper={!isEnabledWrapper}
			headerRowRef={headerRowRef}
			tableRef={ref}
		>
			<TablePropsProvider tableProps={filterAndSortProps}>
				<TableWrapper activeFilter={active.filter} tableData={tableData}>
					{table}
				</TableWrapper>
			</TablePropsProvider>
		</StickyTableWrapper>
	);
};

export default Table;
