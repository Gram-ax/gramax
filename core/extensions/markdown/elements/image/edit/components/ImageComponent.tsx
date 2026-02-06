import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { resolveFloat } from "@ext/markdown/elements/float/edit/logic/resolveFloat";
import Image from "@ext/markdown/elements/image/edit/components/Image";
import getNaturalSize from "@ext/markdown/elements/image/edit/logic/getNaturalSize";
import { NodeViewProps } from "@tiptap/core";
import { ReactElement, useCallback, useRef } from "react";

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
			data-drag-handle
			data-float={float}
			data-resize-container
			draggable={true}
			props={props}
			ref={hoverElement}
		>
			<Image
				alt={node.attrs.alt}
				commentId={node.attrs.comment?.id}
				crop={node.attrs.crop}
				editor={editor}
				getPos={getPos}
				height={node.attrs.height}
				hoverElementRef={hoverElement}
				id={node.attrs.id}
				objects={node.attrs.objects}
				scale={node.attrs.scale}
				selected={isSelected}
				src={node.attrs.src}
				title={node.attrs.title}
				updateAttributes={updateAttributesCallback}
				width={node.attrs.width}
			/>
		</NodeViewContextableWrapper>
	);
};

export default ImageComponent;
