import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useState } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const OpenApiComponent = ({ node, updateAttributes, getPos }: NodeViewProps): ReactElement => {
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
				<OpenApi {...node.attrs} isUpdating={isUpdating} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default OpenApiComponent;
