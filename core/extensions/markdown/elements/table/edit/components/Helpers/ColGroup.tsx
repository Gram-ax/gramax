import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import useWatch from "@core-ui/hooks/useWatch";
import type { Node } from "@tiptap/pm/model";
import { memo, type RefObject, useLayoutEffect, useMemo, useState } from "react";

interface ColGroupProps {
	content?: Node;
	parentElement?: HTMLElement;
	tableRef?: RefObject<HTMLTableElement>;
	init?: {
		colCount?: number;
		colInfo?: ColInfo[];
	};
}

export interface ColInfo {
	colspan: number;
	colwidth?: (number | string)[];
}

const TABLE_WRAPPER_PADDINGS = 48; //1.5em + 1.5em

const getColInfo = (colCount?: number) => {
	const colInfo: ColInfo[] = [];
	for (let index = 0; index < colCount; index++) {
		colInfo.push({ colspan: 1 });
	}
	return colInfo;
};

const ColGroup = ({ content, parentElement, tableRef, init }: ColGroupProps) => {
	const articleRef = ArticleRefService.value;
	const [colInfo, setColInfo] = useState<ColInfo[]>(init?.colInfo || getColInfo(init?.colCount));

	const getCellWidthFromParent = () => {
		const style = window.getComputedStyle(parentElement);
		const paddingLeft = parseFloat(style.paddingLeft);
		const paddingRight = parseFloat(style.paddingRight);
		return parentElement?.clientWidth - (paddingLeft + paddingRight) - TABLE_WRAPPER_PADDINGS - 1;
	};

	const calculateCellWidth = (cols: ColInfo[]): number => {
		if (cols.length === 0) return null;

		if (cols.some((col) => col.colwidth?.[0])) return null;

		const maxWidth = parentElement
			? getCellWidthFromParent()
			: articleRef?.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!maxWidth) return null;

		const totalColspan = cols.reduce((sum, col) => sum + col.colspan, 0);
		return maxWidth / totalColspan;
	};

	const getCellWidthFrominitProps = () => (init?.colCount ? calculateCellWidth(colInfo) : null);
	const [cellWidth, setCellWidth] = useState<number>(getCellWidthFrominitProps());

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

		const firstRow = tableRef.current.querySelector("tbody > tr");
		if (!firstRow) return [];

		const cells = Array.from(firstRow.children) as HTMLElement[];
		return cells.map((cell) => {
			const colwidth = cell.getAttribute("colwidth") || cell.getAttribute("data-colwidth");
			const colwidths = colwidth?.split(",").map((w) => normalizeWidth(w.trim()));
			const colspan = parseInt(cell.getAttribute("colspan") || "1");
			return { colspan, colwidth: colwidths };
		});
	};

	const updateColInfo = () => {
		if (init?.colInfo?.length || init?.colCount) {
			cellWidth && setCellWidth(getCellWidthFrominitProps());
			return;
		}
		const newColInfo = content ? getColInfoFromNode() : getColInfoFromTable();
		const newCellWidth = calculateCellWidth(newColInfo);

		setColInfo(newColInfo);
		setCellWidth(newCellWidth);
	};

	useWatch(() => {
		init?.colInfo && setColInfo(init?.colInfo);
	}, [init?.colInfo]);

	useWatch(() => {
		if (init?.colInfo) return;
		const newColInfo = getColInfo(init?.colCount);
		setColInfo(newColInfo);
		setCellWidth(calculateCellWidth(newColInfo));
	}, [init?.colCount]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: hope it works the way it needs to.
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
	}, [content, parentElement, tableRef?.current, articleRef?.current, init?.colInfo, init?.colCount]);

	const generatedCols = useMemo(() => {
		const cols = [];

		colInfo.forEach((col, i) => {
			for (let j = 0; j < col.colspan; j++) {
				const colwidth = col.colwidth?.[j];
				const width = cellWidth || colwidth;

				if (width) {
					cols.push(
						<col
							key={`${i}-${j}-${width}`}
							style={{
								minWidth: `${typeof width === "number" ? `${width}px` : width}`,
								width: `${typeof width === "number" ? `${width}px` : width}`,
							}}
						/>,
					);
				} else cols.push(<col key={`${i}-${j}`} />);
			}
		});

		return cols;
	}, [colInfo, cellWidth]);

	return (
		<>
			<colgroup>{generatedCols}</colgroup>
			<thead contentEditable="false" style={{ userSelect: "none" }}>
				<tr style={{ visibility: "hidden" }}>
					{generatedCols.map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey:  just need a row with cells in order to know the column width in safari
						<td contentEditable="false" key={i} style={{ height: "0px", padding: "0", border: "none" }} />
					))}
				</tr>
			</thead>
		</>
	);
};

export default memo(ColGroup);
