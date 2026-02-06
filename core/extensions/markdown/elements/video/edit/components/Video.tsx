import BlockActionPanel from "@components/BlockActionPanel";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import VideoActions from "@ext/markdown/elements/video/edit/components/VideoActions";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import Video from "../../render/components/Video";

const EditVideo = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos } = props;
	const isEditable = editor.isEditable;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs?.title?.length > 0);
	const updateAttributes = (attributes: Record<string, any>) => {
		const tr = editor.view.state.tr;
		const pos = getPos();

		Object.keys(attributes).forEach((key) => {
			tr.setNodeAttribute(pos, key, attributes[key]);
		});

		editor.view.dispatch(tr);
	};

	return (
		<NodeViewContextableWrapper data-drag-handle draggable={true} props={props} ref={hoverElement}>
			<BlockActionPanel
				actionsOptions={{ comment: true }}
				getPos={getPos}
				hasSignature={hasSignature}
				hoverElementRef={hoverElement}
				isSignature={node.attrs?.title?.length > 0}
				rightActions={
					isEditable && (
						<VideoActions
							node={node}
							setHasSignature={setHasSignature}
							signatureRef={signatureRef}
							updateAttributes={updateAttributes}
						/>
					)
				}
				setHasSignature={setHasSignature}
				signatureRef={signatureRef}
				signatureText={node.attrs.title}
				updateAttributes={updateAttributes}
			>
				<Video
					commentId={node.attrs.comment?.id}
					noEm={isEditable}
					path={node.attrs.path}
					title={node.attrs.title}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};
export default EditVideo;
