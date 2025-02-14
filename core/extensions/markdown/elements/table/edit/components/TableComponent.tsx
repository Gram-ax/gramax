import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { NodeViewProps, NodeViewWrapper, useReactNodeView } from "@tiptap/react";
import { useLayoutEffect, useRef } from "react";

const TableComponent = ({ node, getPos, editor }: NodeViewProps) => {
	const { nodeViewContentRef } = useReactNodeView();
	const tableRef = useRef<HTMLTableElement>(null);
	const hoverElementRef = useRef<HTMLTableElement>(null);

	useLayoutEffect(() => {
		tableRef.current = hoverElementRef.current?.querySelector(".tableComponent");
	}, [hoverElementRef.current]);

	useAggregation(tableRef, node.content);

	const table = (
		<table ref={nodeViewContentRef} className="tableComponent" data-header={node.attrs.header}>
			<ColGroup content={node.firstChild} />
		</table>
	);

	if (!editor.isEditable) return <NodeViewWrapper ref={hoverElementRef}>{table}</NodeViewWrapper>;

	return (
		<NodeViewWrapper ref={hoverElementRef}>
			<TableHelper tableRef={tableRef} hoverElementRef={hoverElementRef} node={node} getPos={getPos}>
				{table}
			</TableHelper>
		</NodeViewWrapper>
	);
};

export default TableComponent;
