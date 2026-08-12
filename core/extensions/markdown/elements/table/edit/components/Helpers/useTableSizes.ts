import { getTableSizes, type TableSizes } from "@ext/markdown/elements/table/edit/logic/utils";
import { type MutableRefObject, useEffect, useState } from "react";

export type TableDataString = TableSizes;

const useTableSizes = (tableRef: MutableRefObject<HTMLTableElement>, onChangeChildCount?: () => void) => {
	const [tableSizes, setTableSizes] = useState<TableDataString>(null);

	useEffect(() => {
		const tableObserver = new ResizeObserver(() => {
			const tableSizes = getTableSizes(tableRef.current);
			setTableSizes(tableSizes);
		});

		const observer = new MutationObserver((mutationsList) => {
			const filterNodes = (nodes: NodeList) => {
				return Array.from(nodes).filter((node: HTMLElement) => {
					return (
						!node?.classList?.contains("column-resize-handle") &&
						node?.dataset?.tablePlusPreview !== "row" &&
						node?.dataset?.tablePlusPreview !== "column"
					);
				});
			};

			for (const mutation of mutationsList) {
				const resizerAddHandlesCount = filterNodes(mutation.addedNodes).length;
				const resizerRemoveHandlesCount = filterNodes(mutation.removedNodes).length;
				const isChildListType = mutation.type === "childList";
				const isAddNodesNonZero = resizerAddHandlesCount !== 0;
				const isRemovedNodesNonZero = resizerRemoveHandlesCount !== 0;
				const isAddNodes = resizerAddHandlesCount === mutation.addedNodes.length;
				const isRemovedNodes = resizerRemoveHandlesCount === mutation.removedNodes.length;

				if (
					isChildListType &&
					((isAddNodesNonZero && isAddNodes) || (isRemovedNodesNonZero && isRemovedNodes))
				) {
					const tableSizes = getTableSizes(tableRef.current);
					setTableSizes(tableSizes);
					return onChangeChildCount?.();
				}
			}
		});

		tableObserver.observe(tableRef.current.lastElementChild);
		observer.observe(tableRef.current.lastElementChild, { childList: true, subtree: true });

		return () => {
			tableObserver.disconnect();
			observer.disconnect();
		};
	}, [tableRef.current, onChangeChildCount]);

	return { tableSizes };
};

export default useTableSizes;
