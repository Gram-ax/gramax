import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";

const StyleWrapper = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<div style={node.attrs.style}>
				<NodeViewContent />
			</div>
		</NodeViewWrapper>
	);
};

export default StyleWrapper;
