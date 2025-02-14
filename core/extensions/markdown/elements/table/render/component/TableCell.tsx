import { AggregationMethod, AlignEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { ReactNode } from "react";

interface TableCellProps {
	children: ReactNode;
	align?: AlignEnumTypes;
	aggregation?: AggregationMethod;
}

const TableCell = (attrs: TableCellProps) => {
	const { children, ...rest } = attrs;
	return <td {...rest}>{children}</td>;
};

export default TableCell;
