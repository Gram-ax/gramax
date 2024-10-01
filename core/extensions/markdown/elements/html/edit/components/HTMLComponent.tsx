import HTML from "@ext/markdown/elements/html/render/components/HTML";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";

const HTMLComponent = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"} className="focus-pointer-events">
			<HTML mode={node.attrs.mode} content={node.attrs.content} />
		</NodeViewWrapper>
	);
};

export default HTMLComponent;
