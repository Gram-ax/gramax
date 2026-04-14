export interface TableCellProps {
	children: React.ReactNode;
	colspan: number;
	colwidth: number[];
	rowspan: number;
}

const TableCell = (props: TableCellProps) => {
	const total = props.colwidth?.reduce((sum, w) => sum + w, 0);
	return <td {...props} style={total ? ({ "--colwidth": `${total}px` } as React.CSSProperties) : {}} />;
};

export default TableCell;
