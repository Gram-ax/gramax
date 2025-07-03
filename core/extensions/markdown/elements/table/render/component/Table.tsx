import { ReactElement, useRef } from "react";
import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";

interface TableProps {
	children?: any;
	header?: TableHeaderTypes;
}

const Table = (props: TableProps): ReactElement => {
	const { children, header } = props;
	const ref = useRef<HTMLTableElement>(null);

	useAggregation(ref);

	return (
		<WidthWrapper>
			<TableWrapper>
				{typeof children === "string" ? (
					<table
						ref={ref}
						dangerouslySetInnerHTML={{ __html: children }}
						suppressHydrationWarning={true}
						data-header={header}
						data-focusable="true"
					/>
				) : (
					<table ref={ref} data-header={header} data-focusable="true">
						<ColGroup tableRef={ref} />
						{children}
					</table>
				)}
			</TableWrapper>
		</WidthWrapper>
	);
};

export default Table;
