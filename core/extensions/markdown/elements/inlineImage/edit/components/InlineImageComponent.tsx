import InlineImage from "@ext/markdown/elements/inlineImage/render/components/InlineImage";
import { NodeViewProps } from "@tiptap/react";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

const InlineImageComponent = (props: NodeViewProps) => {
	const { node } = props;

	return (
		<NodeViewContextableWrapper props={props} as="span" data-drag-handle>
			<InlineImage
				src={node.attrs.src}
				alt={node.attrs.alt}
				width={node.attrs.width}
				height={node.attrs.height}
				commentId={node.attrs.comment?.id}
			/>
		</NodeViewContextableWrapper>
	);
};

export default InlineImageComponent;
