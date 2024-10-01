import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Drawio from "../../render/component/Drawio";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

const DrawioComponent = ({ node }: NodeViewProps): ReactElement => {
	const nodeSrc: string = node.attrs.src;
	const articleProps = ArticlePropsService.value;

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DrawioEditor, {
			src: nodeSrc,
			logicPath: articleProps.logicPath,
		});
	};
	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle className="focus-pointer-events">
			<Drawio
				id={getDrawioID(nodeSrc, articleProps.logicPath)}
				openEditor={openEditor}
				src={nodeSrc}
				title={node.attrs.title}
			/>
		</NodeViewWrapper>
	);
};

export default DrawioComponent;
