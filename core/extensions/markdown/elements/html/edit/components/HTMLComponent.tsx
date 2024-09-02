import HTML from "@ext/markdown/elements/html/render/components/HTML";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const HTMLComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos } = props;

	return (
		<NodeViewWrapper as={"div"}>
			<Focus getPos={getPos}>
				<HTML content={node.attrs.content} />
			</Focus>
		</NodeViewWrapper>
	);
};

export default HTMLComponent;
