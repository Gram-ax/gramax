import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import useWatch from "@core-ui/hooks/useWatch";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import TableHelper from "@ext/markdown/elements/table/edit/components/Helpers/TableHelper";
import { useAggregation } from "@ext/markdown/elements/table/edit/logic/aggregation";
import useFilterAndSort from "@ext/markdown/elements/table/edit/logic/sortAndFilter/useFilterAndSort";
import { updateTableProps } from "@ext/markdown/elements/table/edit/logic/tablePropsStore";
import TableWrapper from "@ext/markdown/elements/table/render/components/TableWrapper";
import { type NodeViewProps, useReactNodeView } from "@tiptap/react";
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
	}, []);

	const pos = getPos();
	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const ParentPos = useMemo(() => {
		const Pos = editor.state.doc.resolve(pos);
		return Pos.depth > 0 ? Pos.start(Pos.depth) : null;
	}, [pos]);
	const parentDom = ParentPos ? editor.view.domAtPos(ParentPos) : null;

	useWatch(() => {
		if (parentDom?.node && parentDom.node.nodeType !== parentDom.node.TEXT_NODE) {
			return setParentElement(parentDom?.node as HTMLElement);
		}
		setParentElement(null);
	}, [parentDom?.node]);

	useAggregation(tableRef, [node.content, node.attrs?.header]);

	const filterAndSortProps = useFilterAndSort(node, editor, pos);
	updateTableProps(pos, filterAndSortProps);

	const { active, tableData, sorted } = filterAndSortProps;

	const table = (
		<TableWrapper activeFilter={active.filter} tableData={tableData}>
			<table
				className="tableComponent"
				data-header={node.attrs.header}
				data-qa={"table"}
				data-testid={"table"}
				ref={nodeViewContentRef}
				{...(filterAndSortProps.sorted ? { "data-sorted": "" } : {})}
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
				hoverElementRef={hoverElementRef}
				node={node}
				pos={pos}
				sorted={sorted}
				tableRef={tableRef}
			>
				{table}
			</TableHelper>
		</NodeViewContextableWrapper>
	);
};

export default TableComponent;
