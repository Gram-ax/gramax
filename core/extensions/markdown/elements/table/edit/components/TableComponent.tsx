import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import useWatch from "@core-ui/hooks/useWatch";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";
import { NodeViewProps, useReactNodeView } from "@tiptap/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const TableComponent = (props: NodeViewProps) => {
	const { node, getPos, editor } = props;
	const { nodeViewContentRef } = useReactNodeView();

	const tableRef = useRef<HTMLTableElement>(null);
	const hoverElementRef = useRef<HTMLTableElement>(null);

	const [parentElement, setParentElement] = useState<HTMLElement>(null);
	const isDisabledWrapper = Boolean(parentElement);

	useLayoutEffect(() => {
		tableRef.current = hoverElementRef.current?.querySelector(".tableComponent");
	}, [hoverElementRef.current]);

	const pos = getPos();
	const $parentPos = useMemo(() => {
		const $pos = editor.state.doc.resolve(pos);
		return $pos.depth > 0 ? $pos.start($pos.depth) : null;
	}, [pos]);
	const parentDom = $parentPos ? editor.view.domAtPos($parentPos) : null;

	useWatch(() => {
		if (parentDom?.node && parentDom.node.nodeType !== parentDom.node.TEXT_NODE) {
			return setParentElement(parentDom?.node as HTMLElement);
		}

		setParentElement(null);
	}, [parentDom?.node]);

	useAggregation(tableRef, [node.content, node.attrs?.header]);

	const table = (
		<TableWrapper>
			<table
				className="tableComponent"
				data-header={node.attrs.header}
				data-qa={"table"}
				ref={nodeViewContentRef}
			>
				<ColGroup content={node.firstChild} parentElement={parentElement} />
			</table>
		</TableWrapper>
	);

	if (!editor.isEditable) {
		return (
			<NodeViewContextableWrapper props={props} ref={hoverElementRef}>
				<StickyTableWrapper disableWrapper={isDisabledWrapper} tableRef={tableRef}>
					{table}
				</StickyTableWrapper>
			</NodeViewContextableWrapper>
		);
	}

	return (
		<NodeViewContextableWrapper props={props} ref={hoverElementRef}>
			<TableHelper
				disabledWrapper={isDisabledWrapper}
				editor={editor}
				getPos={getPos}
				hoverElementRef={hoverElementRef}
				node={node}
				tableRef={tableRef}
			>
				{table}
			</TableHelper>
		</NodeViewContextableWrapper>
	);
};

export default TableComponent;
