import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import WidthWrapper from "@components/WidthWrapper/WidthWrapper";

const TableComponent = ({ node }: NodeViewProps) => {
	const content = node.firstChild;

	return (
		<NodeViewWrapper>
			<WidthWrapper>
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
			</WidthWrapper>
		</NodeViewWrapper>
	);
};

export default TableComponent;
