import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import Image from "@ext/markdown/elements/image/edit/components/Image";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import { NodeViewProps } from "@tiptap/core";
import { ReactElement, useCallback, useRef } from "react";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import { resolveFloat } from "@ext/markdown/elements/float/edit/logic/resolveFloat";

const ImageComponent = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos, selected, updateAttributes } = props;
	const isSelected = editor.isEditable && selected && editor.state.selection.from + 1 === editor.state.selection.to;
	const hoverElement = useRef<HTMLDivElement>(null);
	const resourceService = ResourceService.value;
	const float = resolveFloat(node.attrs.float);

	const updateAttributesCallback = useCallback(
		async (attributes: Record<string, any>) => {
			const pos = getPos();

			if (!node.attrs?.width) {
				if (!pos) return;
				const buffer = resourceService.getBuffer(node.attrs.src);

				if (buffer) {
					const urlToImage = URL.createObjectURL(new Blob([buffer], { type: resolveFileKind(buffer) }));
					const newSize = await getNaturalSize(urlToImage);
					if (newSize) {
						attributes.width = newSize.width + "px";
						attributes.height = newSize.height + "px";
					}
					URL.revokeObjectURL(urlToImage);
				}
			}

			updateAttributes(attributes);
		},
		[getPos, updateAttributes, node.attrs?.width],
	);

	return (
		<NodeViewContextableWrapper
			ref={hoverElement}
			draggable={true}
			props={props}
			data-float={float}
			data-drag-handle
			data-resize-container
		>
			<Image
				editor={editor}
				updateAttributes={updateAttributesCallback}
				selected={isSelected}
				id={node.attrs.id}
				title={node.attrs.title}
				objects={node.attrs.objects}
				src={node.attrs.src}
				alt={node.attrs.alt}
				width={node.attrs.width}
				height={node.attrs.height}
				getPos={getPos}
				hoverElementRef={hoverElement}
				scale={node.attrs.scale}
				crop={node.attrs.crop}
				commentId={node.attrs.comment?.id}
			/>
		</NodeViewContextableWrapper>
	);
};

export default ImageComponent;
