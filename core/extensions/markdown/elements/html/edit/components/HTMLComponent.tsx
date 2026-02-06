import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import HTMLActions from "@ext/markdown/elements/html/edit/components/HTMLActions";
import HTML from "@ext/markdown/elements/html/render/components/HTML";
import { NodeViewProps } from "@tiptap/core";
import { ReactElement, useRef } from "react";

const HTMLComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.HTMLEditor, {
			editor,
			content: node.attrs.content,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<NodeViewContextableWrapper as={"div"} data-qa="qa-html" props={props} ref={hoverElement}>
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
					<HTML content={node.attrs.content} />
				</BlockCommentView>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default HTMLComponent;
