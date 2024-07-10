import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";
import DiagramData from "../../component/DiagramData";

const DiagramComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<DiagramData {...node.attrs} diagramName={node.attrs.diagramName} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default DiagramComponent;
