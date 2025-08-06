import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef, useState } from "react";
import Video from "../../render/components/Video";
import BlockActionPanel from "@components/BlockActionPanel";
import VideoActions from "@ext/markdown/elements/video/edit/components/VideoActions";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

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
		<NodeViewContextableWrapper ref={hoverElement} props={props} draggable={true} data-drag-handle>
			<BlockActionPanel
				isSignature={node.attrs?.title?.length > 0}
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				signatureText={node.attrs.title}
				actionsOptions={{ comment: true }}
				hasSignature={hasSignature}
				getPos={getPos}
				setHasSignature={setHasSignature}
				signatureRef={signatureRef}
				rightActions={
					isEditable && (
						<VideoActions
							updateAttributes={updateAttributes}
							signatureRef={signatureRef}
							node={node}
							setHasSignature={setHasSignature}
						/>
					)
				}
			>
				<Video
					noEm={isEditable}
					path={node.attrs.path}
					title={node.attrs.title}
					commentId={node.attrs.comment?.id}
				/>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};
export default EditVideo;
