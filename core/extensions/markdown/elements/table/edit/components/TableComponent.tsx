import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import TableWrapper from "@ext/markdown/elements/table/render/component/TableWrapper";

const TableComponent = ({ node }: NodeViewProps) => {
	const content = node.firstChild;

	return (
		<NodeViewWrapper>
			<TableWrapper>
				<NodeViewContent as="table" style={{ display: "block ruby" }}>
					<colgroup>
						{Array.from({ length: content.childCount }, (_, i) => {
							const columnAttrs = content.child(i).attrs;

							return Array.from({ length: columnAttrs.colspan }, (_, j) => {
								const colwidth = columnAttrs.colwidth?.[j];
								return (
									<col
										key={`${i}-${j}`}
										{...(colwidth && {
											style: {
												minWidth: `${colwidth}px`,
												width: `${colwidth}px`,
											},
										})}
									/>
								);
							});
						})}
					</colgroup>
				</NodeViewContent>
			</TableWrapper>
		</NodeViewWrapper>
	);
};

export default TableComponent;
