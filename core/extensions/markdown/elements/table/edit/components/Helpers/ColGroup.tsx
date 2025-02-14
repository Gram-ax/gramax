import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import useWatch from "@core-ui/hooks/useWatch";
import { Node } from "@tiptap/pm/model";
import { memo, useEffect, useState } from "react";

const tableHasColumnWidth = (firstRow: Node) => {
	for (let i = 0; i < firstRow.childCount; i++) {
		const cell = firstRow.child(i);
		if (cell.attrs.colwidth && cell.attrs.colwidth[0]) return true;
	}

	return false;
};

const ColGroup = ({ content }: { content: Node }) => {
	const articleRef = ArticleRefService.value;
	const maxWidth = articleRef.current?.firstElementChild?.firstElementChild?.clientWidth - 36;
	const [cellWidth, setCellWidth] = useState<number>(
		tableHasColumnWidth(content) ? null : maxWidth / (content.childCount + 1 - content.child(0).attrs.colspan),
	);

	useEffect(() => {
		const onResize = () => {
			const maxWidth = articleRef.current?.firstElementChild?.firstElementChild?.clientWidth - 36;
			const newCellWidth = tableHasColumnWidth(content)
				? null
				: maxWidth / (content.childCount + 1 - content.child(0).attrs.colspan);
			if (newCellWidth !== cellWidth) setCellWidth(newCellWidth);
		};

		window.addEventListener("resize", onResize);
		return () => {
			window.removeEventListener("resize", onResize);
		};
	}, [content]);

	useWatch(() => {
		const maxWidth = articleRef.current?.firstElementChild?.firstElementChild?.clientWidth - 36;
		const newCellWidth = tableHasColumnWidth(content)
			? null
			: maxWidth / (content.childCount + 1 - content.child(0).attrs.colspan);
		if (newCellWidth !== cellWidth) setCellWidth(newCellWidth);
	}, [content]);

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
