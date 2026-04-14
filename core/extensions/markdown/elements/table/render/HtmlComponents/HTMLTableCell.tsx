import type { TableCellProps } from "@ext/markdown/elements/table/render/components/TableCell";

const TableCell = (props: TableCellProps) => {
	return <td {...props} />;
};

export default TableCell;
