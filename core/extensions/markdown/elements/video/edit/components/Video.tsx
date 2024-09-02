import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

import Video from "../../render/components/Video";

const EditVideo = ({ node, getPos }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper draggable={true} data-drag-handle>
			<Focus getPos={getPos}>
				<Video path={node.attrs.path} title={node.attrs.title} />
			</Focus>
		</NodeViewWrapper>
	);
};
export default EditVideo;
