import BlockActionPanel from "@components/BlockActionPanel";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import VideoActions from "@ext/markdown/elements/video/edit/components/VideoActions";
import getVideoLayout from "@ext/markdown/elements/video/logic/getVideoLayout";
import { getVideoResizerClassName } from "@ext/markdown/elements/video/render/components/videoComponentStyles";
import type { NodeViewProps } from "@tiptap/react";
import type { Attrs } from "prosemirror-model";
import { type ReactElement, useCallback, useRef, useState } from "react";
import Video from "../../render/components/Video";

const EditVideo = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos, selected } = props;
	const isEditable = editor.isEditable;
	const hoverElement = useRef<HTMLDivElement>(null);
	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs?.title?.length > 0);

	const updateAttributes = useCallback(
		(attributes: Attrs) => {
			const tr = editor.view.state.tr;
			const pos = getPos();

			Object.keys(attributes).forEach((key) => {
				tr.setNodeAttribute(pos, key, attributes[key]);
			});

			editor.view.dispatch(tr);
		},
		[editor, getPos],
	);

	const saveResize = (resize: string) => {
		updateAttributes({ scale: resize });
	};

	const layout = getVideoLayout(node.attrs.path);

	return (
		<NodeViewContextableWrapper
			data-component="video"
			data-drag-handle
			data-resize-container
			draggable={true}
			props={props}
			ref={hoverElement}
		>
			<ArticleComponentResizer
				className={getVideoResizerClassName(layout)}
				defaultScale={layout === "vertical" ? undefined : "100%"}
				disabled={!isEditable}
				onChange={saveResize}
				scale={node.attrs.scale}
				selected={selected}
			>
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
						inEditor
						noEm={isEditable}
						path={node.attrs.path}
						scale={node.attrs.scale}
						title={node.attrs.title}
					/>
				</BlockActionPanel>
			</ArticleComponentResizer>
		</NodeViewContextableWrapper>
	);
};
export default EditVideo;
