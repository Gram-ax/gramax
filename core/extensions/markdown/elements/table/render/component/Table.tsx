import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";
import { ReactElement, useRef } from "react";

interface TableProps {
	children?: any;
	header?: TableHeaderTypes;
	isPrint?: boolean;
}

const Table = (props: TableProps): ReactElement => {
	const { children, header, isPrint } = props;
	const ref = useRef<HTMLTableElement>(null);

	useAggregation(ref);

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
			<table ref={ref} data-header={header} data-focusable="true" style={{ padding: "1.5em 0" }}>
				<ColGroup tableRef={ref} isPrint={isPrint} />
				{children}
			</table>
		);

	if (isPrint) return table;

	return (
		<WidthWrapper>
			<TableWrapper>{table}</TableWrapper>
		</WidthWrapper>
	);
};

export default Table;
