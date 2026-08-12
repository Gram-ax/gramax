import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import HTMLActions from "@ext/markdown/elements/html/edit/components/HTMLActions";
import HTML from "@ext/markdown/elements/html/render/components/HTML";
import type { NodeViewProps } from "@tiptap/core";
import { type ReactElement, useCallback, useRef } from "react";

const HTMLComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes, selected } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	const openEditor = useCallback(() => {
		ModalToOpenService.setValue(ModalToOpen.HTMLEditor, {
			editor,
			content: node.attrs.content,
			onClose: () => ModalToOpenService.resetValue(),
		});
	}, [editor, node?.attrs?.content]);

	const saveResize = useCallback(
		(resize: string) => {
			updateAttributes({ scale: resize });
		},
		[updateAttributes],
	);

	return (
		<NodeViewContextableWrapper
			as={"div"}
			data-component="html"
			data-qa="qa-html"
			data-resize-container
			props={props}
			ref={hoverElement}
		>
			<ArticleComponentResizer
				defaultScale="100%"
				disabled={!isEditable}
				onChange={saveResize}
				scale={node.attrs.scale}
				selected={selected}
			>
				<BlockActionPanel
					actionsOptions={{
						comment: true,
					}}
					getPos={getPos}
					hoverElementRef={hoverElement}
					rightActions={isEditable && <HTMLActions openEditor={openEditor} />}
					updateAttributes={updateAttributes}
				>
					<BlockCommentView commentId={node.attrs?.comment?.id}>
						<HTML content={node.attrs.content} inEditor />
					</BlockCommentView>
				</BlockActionPanel>
			</ArticleComponentResizer>
		</NodeViewContextableWrapper>
	);
};

export default HTMLComponent;
