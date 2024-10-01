import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";

import Video from "../../render/components/Video";

const EditVideo = ({ node }: NodeViewProps): ReactElement => {
	return (
		<NodeViewWrapper draggable={true} data-drag-handle className="focus-pointer-events">
			<Video path={node.attrs.path} title={node.attrs.title} />
		</NodeViewWrapper>
	);
};
export default EditVideo;
