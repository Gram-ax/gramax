import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Unsupported from "@ext/markdown/elements/unsupported/render/component/Unsupported";

const EditUnsupported = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Unsupported {...node.attrs} />
		</NodeViewWrapper>
	);
};
export default EditUnsupported;
