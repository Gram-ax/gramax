import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useState } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";
import DiagramData from "../../component/DiagramData";

const DiagramComponent = ({ node, updateAttributes, getPos }: NodeViewProps): ReactElement => {
	const [isUpdating, setIsUpdating] = useState(node.attrs.isUpdating);

	useEffect(() => {
		setIsUpdating(node.attrs.isUpdating);
	}, [node.attrs.isUpdating]);

	useEffect(() => {
		if (isUpdating) updateAttributes({ isUpdating: false });
	}, [isUpdating]);

	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<DiagramData {...node.attrs} diagramName={node.attrs.diagramName} isUpdating={isUpdating} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default DiagramComponent;
