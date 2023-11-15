import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";
import Drawio from "../../render/component/Drawio";

const DrawioComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<Drawio src={node.attrs.src} title={node.attrs.title} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default DrawioComponent;
