import Paginator from "@ext/print/utils/pagination/Paginator";
import { ReactElement, useLayoutEffect, useState } from "react";

const getColWidths = (firstRow: ReactElement, pageWidth: number) => {
	const children = firstRow?.props?.children as ReactElement | ReactElement[];
	if (!children) return {};
	const cells = Array.isArray(children) ? children : [children];

	let totalKnownWidth = 0;
	let unknownCount = 0;
	const widths: number[] = [];

	let colsCount = 0;

	cells.forEach((cell) => {
		const colWidths = cell.props.colwidth || [];
		const colspan = parseInt(cell.props.colspan) || 1;
		for (let i = 0; i < colspan; i++) {
			const colWidth = colWidths[i];
			if (colWidth) {
				totalKnownWidth += parseFloat(colWidth);
				widths.push(parseInt(colWidth));
			} else {
				widths.push(0);
				unknownCount++;
			}
		}
		colsCount += colspan;
	});

	const defaultColwidth = pageWidth / colsCount;
	const remainingWidth = pageWidth - defaultColwidth * unknownCount;
	const coefficient = totalKnownWidth <= remainingWidth ? 1 : remainingWidth / totalKnownWidth;

	const absoluteWidths = widths.map((width) => {
		if (!width) return defaultColwidth;
		return width * coefficient;
	});

	const totalTableWidth = absoluteWidths.reduce((sum, width) => sum + width, 0);

	return {
		totalTableWidth,
		colWidth: absoluteWidths.map((width) => (width / totalTableWidth) * 100),
	};
};

const PrintColGroup = ({ firstRow }: { firstRow: ReactElement }) => {
	const [colWidths, setColWidths] = useState<number[]>([]);
	const [totalTableWidth, setTotalTableWidth] = useState<number>(0);

	const maxWidth = Paginator.printPageInfo.usablePageWidth;

	useLayoutEffect(() => {
		if (!firstRow) return;
		const { totalTableWidth, colWidth } = getColWidths(firstRow, maxWidth);
		setTotalTableWidth(totalTableWidth);
		setColWidths(colWidth);
	}, [firstRow, maxWidth]);

	if (!colWidths.length) return;
	return {
		colgroup: (
			<colgroup>
				{colWidths.map((width, index) => (
					<col
						key={index}
						style={{
							width: `${width}%`,
							minWidth: `${width}%`,
						}}
					/>
				))}
			</colgroup>
		),
		totalTableWidth,
	};
};

export default PrintColGroup;
