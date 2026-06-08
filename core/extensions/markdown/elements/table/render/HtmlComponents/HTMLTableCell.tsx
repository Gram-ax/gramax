import type { TableCellProps } from "@ext/markdown/elements/table/render/components/TableCell";

const HTMLTableCell = (props: TableCellProps) => {
	return <td {...props} />;
};

export default HTMLTableCell;
