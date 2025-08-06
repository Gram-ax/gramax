import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { NodeViewProps, useReactNodeView } from "@tiptap/react";
import { useLayoutEffect, useRef, useState } from "react";
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

	useWatch(() => {
		const $pos = editor.state.doc.resolve(getPos());

		if ($pos.depth > 0) {
			const $parent = $pos.start($pos.depth);

			const dom = editor.view.domAtPos($parent);
			return setParentElement(dom?.node as HTMLElement);
		}

		setParentElement(null);
	}, [getPos()]);

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
