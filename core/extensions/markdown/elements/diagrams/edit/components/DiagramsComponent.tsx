import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import DiagramData from "../../component/DiagramData";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";

const DiagramComponent = ({ node, editor }: NodeViewProps): ReactElement => {
	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: OnLoadResourceService.getBuffer(node.attrs.src).toString(),
			src: node.attrs.src,
			diagramName: node.attrs.diagramName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle className="focus-pointer-events">
			<DiagramData openEditor={openEditor} {...node.attrs} diagramName={node.attrs.diagramName} />
		</NodeViewWrapper>
	);
};
export default DiagramComponent;
