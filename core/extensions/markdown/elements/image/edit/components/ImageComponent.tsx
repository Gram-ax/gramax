import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import Image from "@ext/markdown/elements/image/edit/components/Image";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useCallback, useRef } from "react";

const ImageComponent = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos, selected } = props;
	const isSelected = editor.isEditable && selected && editor.state.selection.from + 1 === editor.state.selection.to;
	const hoverElement = useRef<HTMLDivElement>(null);
	const resourceService = ResourceService.value;

	const updateAttributes = useCallback(
		async (attributes: Record<string, any>) => {
			const pos = getPos();
			if (!pos) return;
			const tr = editor.view.state.tr;
			const buffer = resourceService.getBuffer(node.attrs.src);
			if (buffer) {
				const urlToImage = URL.createObjectURL(new Blob([buffer], { type: resolveImageKind(buffer) }));
				const newSize = await getNaturalSize(urlToImage);
				if (newSize) {
					attributes.width = newSize.width + "px";
					attributes.height = newSize.height + "px";
				}
				URL.revokeObjectURL(urlToImage);
			}

			Object.keys(attributes).forEach((key) => {
				tr.setNodeAttribute(pos, key, attributes[key]);
			});

			editor.view.dispatch(tr);
		},
		[editor?.view, getPos],
	);

	return (
		<NodeViewWrapper ref={hoverElement} draggable={true} data-drag-handle>
			<Image
				editor={editor}
				updateAttributes={updateAttributes}
				selected={isSelected}
				node={node}
				getPos={getPos}
				hoverElementRef={hoverElement}
			/>
		</NodeViewWrapper>
	);
};

export default ImageComponent;
