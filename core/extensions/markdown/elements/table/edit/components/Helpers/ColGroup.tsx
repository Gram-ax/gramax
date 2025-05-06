import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import useWatch from "@core-ui/hooks/useWatch";
import { Node } from "@tiptap/pm/model";
import { memo, useEffect, useState } from "react";

const ColGroup = ({ content, parentElement }: { content: Node; parentElement: HTMLElement }) => {
	const articleRef = ArticleRefService.value;
	const maxWidth =
		parentElement?.clientWidth - 36 || articleRef.current?.firstElementChild?.firstElementChild?.clientWidth - 36;

	const getCellWidth = (): number => {
		let colspanCount = 0;
		for (let i = 0; i < content.childCount; i++) {
			const cell = content.child(i);
			if (cell.attrs.colwidth && cell.attrs.colwidth[0]) return null;
			colspanCount += cell.attrs.colspan;
		}

		return maxWidth / colspanCount;
	};

	const [cellWidth, setCellWidth] = useState<number>(getCellWidth());

	useEffect(() => {
		const onResize = () => {
			const newCellWidth = getCellWidth();
			if (newCellWidth !== cellWidth) setCellWidth(newCellWidth);
		};

		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, [content, parentElement]);

	useWatch(() => {
		const newCellWidth = getCellWidth();
		if (newCellWidth !== cellWidth) setCellWidth(newCellWidth);
	}, [content, parentElement]);

	return (
		<colgroup>
			{Array.from({ length: content.childCount }, (_, i) => {
				const columnAttrs = content.child(i).attrs;

				return Array.from({ length: columnAttrs.colspan }, (_, j) => {
					const colwidth = columnAttrs.colwidth?.[j];
					return (
						<col
							key={`${i}-${j}`}
							style={{
								minWidth: `${cellWidth ? cellWidth : colwidth}px`,
								width: `${cellWidth ? cellWidth : colwidth}px`,
							}}
						/>
					);
				});
			})}
		</colgroup>
	);
};

export default memo(ColGroup);
