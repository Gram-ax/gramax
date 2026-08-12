import type { ReactNode } from "react";

export interface TableRowProps {
	children: ReactNode;
	initialOrder?: number;
}

const TableRow = ({ initialOrder, children, ...otherProps }: TableRowProps) => {
	return (
		<tr {...otherProps} data-initial-order={initialOrder}>
			{children}
		</tr>
	);
};

export default TableRow;
