import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import styled from "@emotion/styled";

const TableComponent = ({ node, className }: NodeViewProps & { className: string }) => {
	const content = node.firstChild;

	return (
		<NodeViewWrapper>
			<WidthWrapper className={className}>
				<NodeViewContent as="table" className="tableComponent">
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

export default styled(TableComponent)`
	@media not print {
		.tableComponent {
			display: block ruby;
		}
	}
`;
