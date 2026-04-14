import Unsupported from "@ext/markdown/elements/unsupported/render/component/Unsupported";
import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type { ReactElement } from "react";

const EditUnsupported = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Unsupported {...node.attrs} />
		</NodeViewWrapper>
	);
};
export default EditUnsupported;
