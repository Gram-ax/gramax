import { ReactElement, useEffect, useRef } from "react";
import WidthWrapper, { CELL_MIN_WIDTH } from "@components/WidthWrapper/WidthWrapper";

const setTableCellsWidth = (table: HTMLTableElement) => {
	const tds = table.getElementsByTagName("td");
	const ths = table.getElementsByTagName("th");
	for (let i = 0; i < tds.length; i++) setCellWidth(tds[i]);
	for (let i = 0; i < ths.length; i++) setCellWidth(ths[i]);
};

const setCellWidth = (cell: HTMLElement) => {
	if (cell.getAttribute("colwidth")) {
		cell.style.width =
			cell
				.getAttribute("colwidth")
				.split(",")
				.map((w) => Number.parseInt(w))
				.reduce((a, b) => a + b, 0)
				.toString() + "px";
		cell.style.minWidth = `max(${cell.style.width}, ${CELL_MIN_WIDTH})`;
	}
};

const Table = ({ children }: { children?: any }): ReactElement => {
	const ref = useRef<HTMLTableElement>(null);

	useEffect(() => {
		if (!ref.current) return;
		setTableCellsWidth(ref.current);
	});

	return (
		<WidthWrapper>
			{typeof children === "string" ? (
				<table ref={ref} dangerouslySetInnerHTML={{ __html: children }} suppressHydrationWarning={true} />
			) : (
				<table ref={ref}>{children}</table>
			)}
		</WidthWrapper>
	);
};

export default Table;
