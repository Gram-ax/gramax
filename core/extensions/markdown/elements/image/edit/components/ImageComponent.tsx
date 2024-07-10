import Image from "@ext/markdown/elements/image/edit/components/Image";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const ImageComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos } = props;

	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<Image
					src={node.attrs.src}
					alt={node.attrs.alt}
					title={node.attrs.title}
					crop={node.attrs.crop}
					objects={node.attrs.objects}
				/>
			</Focus>
		</NodeViewWrapper>
	);
};

export default ImageComponent;
