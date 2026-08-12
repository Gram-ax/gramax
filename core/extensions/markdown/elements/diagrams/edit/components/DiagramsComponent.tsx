import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import DiagramActions from "@ext/markdown/elements/diagrams/edit/components/DiagramActions";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import { resolveFloat } from "@ext/markdown/elements/float/edit/logic/resolveFloat";
import type { NodeViewProps } from "@tiptap/react";
import { type ReactElement, useCallback, useRef, useState } from "react";
import DiagramData from "../../component/DiagramData";

const DIAGRAMS_ACTIONS_OPTIONS = {
	comment: true,
	float: true,
};

const DiagramComponent = (props: NodeViewProps): ReactElement => {
	const { node, editor, getPos, selected, updateAttributes: propsUpdateAttributes } = props;
	const { getBuffer } = ResourceService.value;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(node.attrs?.title?.length > 0);
	const isEditable = editor.isEditable;
	const float = resolveFloat(node.attrs.float);

	const openEditor = useCallback(() => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: node.attrs.content ?? getBuffer(node.attrs.src)?.toString(),
			src: node.attrs.src,
			diagramName: node.attrs.diagramName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [editor, node.attrs.content, node.attrs.src, node.attrs.diagramName, getBuffer]);

	const getNewSize = useCallback(() => {
		if (!node.attrs.data) return;
		const { width, height } = getNaturalSize(getBuffer(node.attrs.src).toString());
		if (!width || !height) return;
		return { width: `${width}px`, height: `${height}px` };
	}, [node.attrs.src, getBuffer, node.attrs.data]);

	const updateAttributes = useCallback(
		(attributes: Record<string, unknown>) => {
			const newSize = getNewSize();
			if (newSize) {
				attributes.width = newSize.width;
				attributes.height = newSize.height;
			}

			propsUpdateAttributes(attributes);
		},
		[getNewSize, propsUpdateAttributes],
	);

	const saveResize = useCallback(
		(resize: string) => {
			updateAttributes({ scale: resize });
		},
		[updateAttributes],
	);

	return (
		<NodeViewContextableWrapper
			data-component="diagram"
			data-drag-handle
			data-float={float ? float : undefined}
			data-resize-container
			props={props}
			ref={hoverElement}
		>
			<ArticleComponentResizer
				disabled={!isEditable}
				onChange={saveResize}
				scale={node.attrs.scale}
				selected={selected}
			>
				<BlockActionPanel
					actionsOptions={DIAGRAMS_ACTIONS_OPTIONS}
					getPos={getPos}
					hasSignature={hasSignature}
					hoverElementRef={hoverElement}
					isSignature={node.attrs?.title?.length > 0}
					rightActions={
						isEditable && (
							<DiagramActions
								editor={editor}
								node={node}
								openEditor={openEditor}
								setHasSignature={setHasSignature}
								signatureRef={signatureRef}
							/>
						)
					}
					setHasSignature={setHasSignature}
					signatureRef={signatureRef}
					signatureText={node.attrs.title}
					updateAttributes={updateAttributes}
				>
					<DiagramData
						commentId={node.attrs.comment?.id}
						content={node.attrs.content}
						diagramName={node.attrs.diagramName}
						height={node.attrs.height}
						noEm={isEditable}
						openEditor={openEditor}
						scale={node.attrs.scale}
						src={node.attrs.src}
						title={node.attrs.title}
						width={node.attrs.width}
					/>
				</BlockActionPanel>
			</ArticleComponentResizer>
		</NodeViewContextableWrapper>
	);
};
export default DiagramComponent;
