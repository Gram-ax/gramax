import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";

const OpenApiComponent = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle className="focus-pointer-events">
			<OpenApi {...node.attrs} />
		</NodeViewWrapper>
	);
};

export default OpenApiComponent;
