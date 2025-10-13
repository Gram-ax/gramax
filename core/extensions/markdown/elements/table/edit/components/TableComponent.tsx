import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { NodeViewProps, useReactNodeView } from "@tiptap/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import useWatch from "@core-ui/hooks/useWatch";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

export const Wrapper = styled.div`
	overflow: auto;
	position: relative;
`;

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

	useAggregation(tableRef, node.content);

	const table = (
		<TableWrapper>
			<table
				data-qa={"table"}
				ref={nodeViewContentRef}
				className="tableComponent"
				data-header={node.attrs.header}
			>
				<ColGroup content={node.firstChild} parentElement={parentElement} />
			</table>
		</TableWrapper>
	);

	if (!editor.isEditable) {
		return (
			<NodeViewContextableWrapper ref={hoverElementRef} props={props}>
				{isDisabledWrapper ? <Wrapper>{table}</Wrapper> : <WidthWrapper>{table}</WidthWrapper>}
			</NodeViewContextableWrapper>
		);
	}

	return (
		<NodeViewContextableWrapper ref={hoverElementRef} props={props}>
			<TableHelper
				tableRef={tableRef}
				hoverElementRef={hoverElementRef}
				node={node}
				getPos={getPos}
				editor={editor}
				disabledWrapper={isDisabledWrapper}
			>
				{table}
			</TableHelper>
		</NodeViewContextableWrapper>
	);
};

export default TableComponent;
