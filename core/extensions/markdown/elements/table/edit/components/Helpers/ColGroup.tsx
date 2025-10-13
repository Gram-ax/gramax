import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { PAGE_WIDTH } from "@ext/print/const";
import { Node } from "@tiptap/pm/model";
import { memo, RefObject, useLayoutEffect, useMemo, useState } from "react";

interface ColGroupProps {
	content?: Node;
	parentElement?: HTMLElement;
	tableRef?: RefObject<HTMLTableElement>;
	isPrint?: boolean;
}

interface ColInfo {
	colspan: number;
	colwidth?: (number | string)[];
}

const TABLE_WRAPPER_PADDINGS = 48; //1.5em + 1.5em

const ColGroup = ({ content, parentElement, tableRef, isPrint }: ColGroupProps) => {
	const articleRef = ArticleRefService.value;
	const [colInfo, setColInfo] = useState<ColInfo[]>([]);
	const [cellWidth, setCellWidth] = useState<number>(null);

	const getColInfoFromNode = (): ColInfo[] => {
		if (!content) return [];

		const cols = [];
		for (let i = 0; i < content.childCount; i++) {
			const cell = content.child(i);
			cols.push({
				colspan: cell.attrs.colspan || 1,
				colwidth: cell.attrs.colwidth || null,
			});
		}

		return cols;
	};

	const normalizeWidth = (width: string): string => {
		if (!width || !Number(width)) return null;
		const hasUnits = /[a-zA-Z%]/.test(width);
		return hasUnits ? width : `${width}px`;
	};

	const getColInfoFromTable = (): ColInfo[] => {
		if (!tableRef?.current) return [];

		const firstRow = tableRef.current.querySelector("tr");
		if (!firstRow) return [];

		const cells = Array.from(firstRow.children) as HTMLElement[];
		return cells.map((cell) => {
			const colwidth = cell.getAttribute("colwidth") || cell.getAttribute("data-colwidth");
			const colwidths = colwidth?.split(",").map((w) => normalizeWidth(w.trim()));
			const colspan = parseInt(cell.getAttribute("colspan") || "1");
			return { colspan, colwidth: colwidths };
		});
	};

	const getCellWidthFromParent = () => {
		const style = window.getComputedStyle(parentElement);
		const paddingLeft = parseFloat(style.paddingLeft);
		const paddingRight = parseFloat(style.paddingRight);
		return parentElement?.clientWidth - (paddingLeft + paddingRight) - TABLE_WRAPPER_PADDINGS - 1;
	};

	const calculateCellWidth = (cols: ColInfo[]): number => {
		if (cols.length === 0) return null;

		if (cols.some((col) => col.colwidth && col.colwidth[0])) return null;

		const maxWidth = parentElement
			? getCellWidthFromParent()
			: articleRef?.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!maxWidth) return null;

		const totalColspan = cols.reduce((sum, col) => sum + col.colspan, 0);
		return maxWidth / totalColspan;
	};

	const updateColInfo = () => {
		const newColInfo = content ? getColInfoFromNode() : getColInfoFromTable();
		const newCellWidth = calculateCellWidth(newColInfo);

		setColInfo(newColInfo);
		setCellWidth(newCellWidth);
	};

	useLayoutEffect(() => {
		updateColInfo();
		const onResize = () => updateColInfo();

		window.addEventListener("resize", onResize);
		const resizeObserver = new ResizeObserver(onResize);
		parentElement && resizeObserver.observe(parentElement);

		return () => {
			window.removeEventListener("resize", onResize);
			parentElement && resizeObserver.disconnect();
		};
	}, [content, parentElement, tableRef?.current, articleRef?.current]);

	const generatedCols = useMemo(() => {
		const cols = [];
		let allWidth = 0;

		colInfo.forEach((col, i) => {
			for (let j = 0; j < col.colspan; j++) {
				const colwidth = col.colwidth?.[j];
				const width = cellWidth || colwidth;

				if (width) {
					cols.push(
						<col
							key={`${i}-${j}`}
							style={{
								minWidth: `${typeof width === "number" ? width + "px" : width}`,
								width: `${typeof width === "number" ? width + "px" : width}`,
							}}
						/>,
					);
					allWidth += typeof width === "string" ? Number(width.replace("px", "")) : width;
				} else cols.push(<col key={`${i}-${j}`} />);
			}
		});

		if (tableRef?.current && isPrint) {
			allWidth = allWidth === 0 ? PAGE_WIDTH : allWidth;
			allWidth = allWidth > PAGE_WIDTH ? PAGE_WIDTH : allWidth;
			tableRef.current.style.width = `${allWidth}px`;
		}

		return cols;
	}, [colInfo, cellWidth]);

	if (isPrint) return null;

	return <colgroup>{generatedCols}</colgroup>;
};

export default memo(ColGroup);
