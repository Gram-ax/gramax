import HtmlTagComponent from "@ext/markdown/elements/htmlTag/edit/component/HtmlTagComponent";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";

const InlineHtmlTagComponent = ({ node }: NodeViewProps) => {
	return (
		<NodeViewWrapper as="span" data-focusable="true">
			<HtmlTagComponent editTree={node.attrs.content} />
		</NodeViewWrapper>
	);
};

export default InlineHtmlTagComponent;
