import { ReactElement, useEffect, useRef } from "react";

const setTableCellsWidth = (table: HTMLTableElement) => {
	const tds = table.getElementsByTagName("td");
	const ths = table.getElementsByTagName("th");
	for (let i = 0; i < tds.length; i++) setCellWidth(tds[i]);
	for (let i = 0; i < ths.length; i++) setCellWidth(ths[i]);
};

const setCellWidth = (cell: HTMLElement) => {
	if (!cell.getAttribute("colwidth")) return;
	cell.style.width =
		cell
			.getAttribute("colwidth")
			.split(",")
			.map((w) => Number.parseInt(w))
			.reduce((a, b) => a + b, 0)
			.toString() + "px";
};

const setTableCellsLeftPadding = (table: HTMLTableElement) => {
	const trs = table.getElementsByTagName("tr");
	let maxCellsInRow = 0;
	for (let i = 0; i < trs.length; i++) {
		if (trs[i].children.length > maxCellsInRow) maxCellsInRow = trs[i].children.length;
	}
	for (let i = 0; i < trs.length; i++) {
		if (trs[i].children.length !== maxCellsInRow) (trs[i].firstChild as HTMLElement).style.paddingLeft = "12px";
	}
};

const Table = ({ children }: { children?: any }): ReactElement => {
	const ref = useRef<HTMLTableElement>(null);

	useEffect(() => {
		if (!ref.current) return;
		setTableCellsWidth(ref.current);
		setTableCellsLeftPadding(ref.current);
	});

	if (typeof children === "string")
		return <table ref={ref} dangerouslySetInnerHTML={{ __html: children }} suppressHydrationWarning={true} />;
	else return <table ref={ref}>{children}</table>;
};

export default Table;
