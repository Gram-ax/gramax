import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

import RenderVideo from "../../render/components/Video";

const EditVideo = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper>
			<Focus position={getPos()}>
				<RenderVideo path={node.attrs.path} title={node.attrs.title} isLink={node.attrs.isLink} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default EditVideo;
