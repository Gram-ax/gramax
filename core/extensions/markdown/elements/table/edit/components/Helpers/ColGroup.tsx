import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { Node } from "@tiptap/pm/model";
import { memo, RefObject, useLayoutEffect, useMemo, useState } from "react";

interface ColGroupProps {
	content?: Node;
	parentElement?: HTMLElement;
	tableRef?: RefObject<HTMLTableElement>;
}

interface ColInfo {
	colspan: number;
	colwidth?: (number | string)[];
}

const ColGroup = ({ content, parentElement, tableRef }: ColGroupProps) => {
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

	const getColInfoFromTable = (): ColInfo[] => {
		if (!tableRef?.current) return [];

		const firstRow = tableRef.current.querySelector("tr");
		if (!firstRow) return [];

		const cells = Array.from(firstRow.children) as HTMLElement[];
		return cells.map((cell) => {
			const colwidth = cell.getAttribute("colwidth") || cell.getAttribute("data-colwidth");
			if (!colwidth) return { colspan: 1, colwidth: null };

			const colwidths = colwidth.split(",").map((w) => w.trim());

			return {
				colspan: parseInt(cell.getAttribute("colspan") || "1"),
				colwidth: colwidths,
			};
		});
	};

	const calculateCellWidth = (cols: ColInfo[]): number => {
		if (cols.length === 0) return null;

		if (cols.some((col) => col.colwidth && col.colwidth[0])) return null;

		const maxWidth =
			parentElement?.clientWidth - 36 ||
			articleRef?.current?.firstElementChild?.firstElementChild?.clientWidth - 36;

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
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, [content, parentElement, tableRef?.current, articleRef?.current]);

	const generatedCols = useMemo(() => {
		const cols = [];

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
				} else cols.push(<col key={`${i}-${j}`} />);
			}
		});

		return cols;
	}, [colInfo, cellWidth]);

	return <colgroup>{generatedCols}</colgroup>;
};

export default memo(ColGroup);
