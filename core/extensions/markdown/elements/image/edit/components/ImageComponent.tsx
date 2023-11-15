import Image from "@components/Atoms/Image/Image";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const EditImage = (props: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={props.getPos()}>
				<Image src={props.node.attrs.src} alt={props.node.attrs.alt} title={props.node.attrs.title} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default EditImage;
