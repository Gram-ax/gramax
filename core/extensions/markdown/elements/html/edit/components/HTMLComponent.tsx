import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import HTMLActions from "@ext/markdown/elements/html/edit/components/HTMLActions";
import HTML from "@ext/markdown/elements/html/render/components/HTML";
import { NodeViewProps } from "@tiptap/core";
import { ReactElement, useRef } from "react";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";

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
		<NodeViewContextableWrapper ref={hoverElement} props={props} as={"div"} data-qa="qa-html">
			<BlockActionPanel
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				actionsOptions={{
					comment: true,
				}}
				getPos={getPos}
				rightActions={isEditable && <HTMLActions openEditor={openEditor} />}
			>
				<BlockCommentView commentId={node.attrs?.comment?.id}>
					<HTML content={node.attrs.content} />
				</BlockCommentView>
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default HTMLComponent;
