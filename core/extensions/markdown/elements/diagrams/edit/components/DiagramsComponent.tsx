import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import DiagramData from "../../component/DiagramData";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import BlockActionPanel from "@components/BlockActionPanel";
import DiagramActions from "@ext/markdown/elements/diagrams/edit/components/DiagramActions";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

const DiagramComponent = (props: NodeViewProps): ReactElement => {
	const { node, editor, getPos } = props;
	const { getBuffer } = ResourceService.value;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(node.attrs?.title?.length > 0);
	const isEditable = editor.isEditable;

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
		<NodeViewContextableWrapper ref={hoverElement} props={props}>
			<BlockActionPanel
				isSignature={node.attrs?.title?.length > 0}
				hoverElementRef={hoverElement}
				updateAttributes={updateAttributes}
				signatureText={node.attrs.title}
				signatureRef={signatureRef}
				actionsOptions={{ comment: true }}
				hasSignature={hasSignature}
				setHasSignature={setHasSignature}
				getPos={getPos}
				rightActions={
					isEditable && (
						<DiagramActions
							editor={editor}
							node={node}
							openEditor={openEditor}
							signatureRef={signatureRef}
							setHasSignature={setHasSignature}
						/>
					)
				}
			>
				<DiagramData
					noEm={isEditable}
					openEditor={openEditor}
					{...node.attrs}
					diagramName={node.attrs.diagramName}
					commentId={node.attrs.comment?.id}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};
export default DiagramComponent;
