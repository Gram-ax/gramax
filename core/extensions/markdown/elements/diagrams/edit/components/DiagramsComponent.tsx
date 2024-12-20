import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import DiagramData from "../../component/DiagramData";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import BlockActionPanel from "@components/BlockActionPanel";
import DiagramActions from "@ext/markdown/elements/diagrams/edit/components/DiagramActions";
import getNaturalSize from "@ext/markdown/elements/diagrams/logic/getNaturalSize";

const DiagramComponent = ({ node, editor, getPos }: NodeViewProps): ReactElement => {
	const { getBuffer } = OnLoadResourceService.value;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(node.attrs?.title?.length > 0);
	const isEditable = editor.isEditable;

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: getBuffer(node.attrs.src).toString(),
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
		<NodeViewWrapper ref={hoverElement} as={"div"} draggable={true} data-drag-handle>
			<BlockActionPanel
				isSignature={node.attrs?.title?.length > 0}
				hoverElementRef={hoverElement}
				updateAttributes={updateAttributes}
				signatureText={node.attrs.title}
				signatureRef={signatureRef}
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
							getPos={getPos}
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
				/>
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};
export default DiagramComponent;
