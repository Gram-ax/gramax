import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import DiagramActions from "@ext/markdown/elements/diagrams/edit/components/DiagramActions";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import { resolveFloat } from "@ext/markdown/elements/float/edit/logic/resolveFloat";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import DiagramData from "../../component/DiagramData";

const DIAGRAMS_ACTIONS_OPTIONS = {
	comment: true,
	float: true,
};

const DiagramComponent = (props: NodeViewProps): ReactElement => {
	const { node, editor, getPos } = props;
	const { getBuffer } = ResourceService.value;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(node.attrs?.title?.length > 0);
	const isEditable = editor.isEditable;
	const float = resolveFloat(node.attrs.float);

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: node.attrs.content ?? getBuffer(node.attrs.src)?.toString(),
			src: node.attrs.src,
			diagramName: node.attrs.diagramName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	const getNewSize = () => {
		if (!node.attrs.data) return;
		const { width, height } = getNaturalSize(getBuffer(node.attrs.src).toString());
		if (!width || !height) return;
		return { width: width + "px", height: height + "px" };
	};

	const updateAttributes = (attributes: Record<string, any>) => {
		const pos = getPos();
		if (!pos) return;
		const tr = editor.view.state.tr;
		const newSize = getNewSize();
		if (newSize) {
			attributes.width = newSize.width;
			attributes.height = newSize.height;
		}

		Object.keys(attributes).forEach((key) => {
			tr.setNodeAttribute(pos, key, attributes[key]);
		});

		editor.view.dispatch(tr);
	};

	return (
		<NodeViewContextableWrapper data-drag-handle data-float={float} props={props} ref={hoverElement}>
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
					src={node.attrs.src}
					title={node.attrs.title}
					width={node.attrs.width}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};
export default DiagramComponent;
