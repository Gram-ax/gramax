import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Unsupported from "@ext/markdown/elements/unsupported/render/component/Unsupported";
import Focus from "@ext/markdown/elementsUtils/wrappers/Focus";

const EditUnsupported = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Focus getPos={getPos}>
				<Unsupported {...node.attrs} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default EditUnsupported;
