import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import InlineImage from "@ext/markdown/elements/inlineImage/render/components/InlineImage";
import { NodeViewProps } from "@tiptap/react";

const InlineImageComponent = (props: NodeViewProps) => {
	const { node } = props;

	return (
		<NodeViewContextableWrapper as="span" data-drag-handle props={props}>
			<InlineImage
				alt={node.attrs.alt}
				commentId={node.attrs.comment?.id}
				height={node.attrs.height}
				src={node.attrs.src}
				width={node.attrs.width}
			/>
		</NodeViewContextableWrapper>
	);
};

export default InlineImageComponent;
