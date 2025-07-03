import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import { NodeViewProps, NodeViewWrapper, useReactNodeView } from "@tiptap/react";
import { useLayoutEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import useWatch from "@core-ui/hooks/useWatch";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";

const Wrapper = styled.div`
	overflow: auto;
`;

const TableComponent = ({ node, getPos, editor }: NodeViewProps) => {
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
			<NodeViewWrapper ref={hoverElementRef}>
				{isDisabledWrapper ? <Wrapper>{table}</Wrapper> : <WidthWrapper>{table}</WidthWrapper>}
			</NodeViewWrapper>
		);
	}

	return (
		<NodeViewWrapper ref={hoverElementRef}>
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
		</NodeViewWrapper>
	);
};

export default TableComponent;
