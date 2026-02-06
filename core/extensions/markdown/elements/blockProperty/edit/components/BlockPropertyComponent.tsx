import styled from "@emotion/styled";
import BlockWrapper from "@ext/markdown/elements/blockContentField/edit/components/BlockWrapper";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";

const Wrapper = styled.div<{ readOnly?: boolean }>`
	min-height: 1.7em;
	pointer-events: ${({ readOnly }) => (readOnly ? "none" : "auto")};
`;

const BlockPropertyComponent = ({ extension }: NodeViewProps) => {
	const [isEditable] = useState(extension.options.canChangeProps);

	return (
		<NodeViewWrapper data-drag-handle={isEditable ? undefined : true} draggable={!isEditable}>
			<BlockWrapper readOnly={!isEditable}>
				<Wrapper readOnly={!isEditable}>
					<NodeViewContent />
				</Wrapper>
			</BlockWrapper>
		</NodeViewWrapper>
	);
};

export default BlockPropertyComponent;
