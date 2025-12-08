import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import ColGroup, { ColInfo } from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";
import { ReactElement, useLayoutEffect, useMemo, useRef, useState } from "react";
import PrintColGroup from "@ext/markdown/elements/table/print/PrintColGroup";

interface TableProps {
	children?: any;
	header?: TableHeaderTypes;
	isPrint?: boolean;
}

const Table = (props: TableProps): ReactElement => {
	const { children, header, isPrint } = props;
	const ref = useRef<HTMLTableElement>(null);
	const [isEnabledWrapper, setIsEnabledWrapper] = useState(false);

	useAggregation(ref);
	const tableChildren = children?.props?.children;
	const firstRow = Array.isArray(tableChildren) ? tableChildren[0] : tableChildren;

	const colInfo: ColInfo[] = useMemo(() => {
		const children = firstRow?.props?.children;
		if (!children) return;
		const cells = Array.isArray(children) ? children : [children];

		if (!Array.isArray(cells) || !cells?.some((cell) => cell.props.colwidth)) return;

		return cells.map((cell) => {
			const colwidth = cell.props.colwidth;
			const colspan = parseInt(cell.props.colspan || "1");
			return { colspan, colwidth };
		});
	}, [firstRow]);

	const printColGroupData = isPrint && firstRow ? PrintColGroup({ firstRow }) : null;
	const ColGroupComponent = isPrint ? printColGroupData?.colgroup : <ColGroup tableRef={ref} initColInfo={colInfo} />;

	const table =
		typeof children === "string" ? (
			<table
				ref={ref}
				dangerouslySetInnerHTML={{ __html: children }}
				suppressHydrationWarning={true}
				data-header={header}
				data-focusable="true"
			/>
		) : (
			<table
				ref={ref}
				data-header={header}
				data-focusable="true"
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
				{children}
			</table>
		);

	if (isPrint)
		return (
			<div data-component="table" style={{ padding: "1.5em 0" }}>
				{table}
			</div>
		);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;

		const wrapper = el.closest('[data-wrapper="table"]');
		setIsEnabledWrapper(wrapper?.parentElement?.parentElement?.nodeName === "ARTICLE");
	});

	return (
		<StickyTableWrapper data-wrapper="table" tableRef={ref} disableWrapper={!isEnabledWrapper}>
			<TableWrapper>{table}</TableWrapper>
		</StickyTableWrapper>
	);
};

export default Table;
