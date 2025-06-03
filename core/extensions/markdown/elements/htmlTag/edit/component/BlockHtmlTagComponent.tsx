import HtmlTagComponent from "@ext/markdown/elements/htmlTag/edit/component/HtmlTagComponent";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const BlockHtmlTagComponent = ({ node }: NodeViewProps) => {
	return (
		<NodeViewWrapper data-focusable="true">
			<HtmlTagComponent editTree={node.attrs.content} />
		</NodeViewWrapper>
	);
};

export default BlockHtmlTagComponent;
