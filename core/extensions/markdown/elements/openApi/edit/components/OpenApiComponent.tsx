import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const OpenApiComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle>
			<Focus getPos={getPos}>
				<OpenApi {...node.attrs} />
			</Focus>
		</NodeViewWrapper>
	);
};

export default OpenApiComponent;
