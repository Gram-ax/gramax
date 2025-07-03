import InlineImage from "@ext/markdown/elements/inlineImage/render/components/InlineImage";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef } from "react";
import InlineImageActions from "@ext/markdown/elements/inlineImage/edit/components/InlineImageActions";
import { NodeSelection } from "@tiptap/pm/state";

const InlineImageComponent = ({ node, editor, getPos }: NodeViewProps) => {
	const hoverElementRef = useRef<HTMLDivElement>(null);

	const toBlock = useCallback(() => {
		const pos = getPos();
		if (pos === undefined) return;

		const tr = editor.view.state.tr;
		const nodePos = pos;

		const blockImageNode = editor.view.state.schema.nodes.image.create({
			src: node.attrs.src,
			alt: node.attrs.alt,
			width: node.attrs.width,
			height: node.attrs.height,
		});

		tr.replaceWith(nodePos, nodePos + node.nodeSize, blockImageNode);
		tr.setSelection(NodeSelection.create(tr.doc, nodePos + 1));
		tr.setMeta("ignoreDeleteNode", true);

		editor.view.dispatch(tr);
	}, [editor, getPos, node]);

	return (
		<NodeViewWrapper ref={hoverElementRef} as="span" data-drag-handle>
			<InlineImage
				src={node.attrs.src}
				alt={node.attrs.alt}
				width={node.attrs.width}
				height={node.attrs.height}
				actions={<InlineImageActions toBlock={toBlock} />}
				hoverElementRef={hoverElementRef}
			/>
		</NodeViewWrapper>
	);
};

export default InlineImageComponent;
