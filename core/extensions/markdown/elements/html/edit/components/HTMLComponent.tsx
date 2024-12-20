import BlockActionPanel from "@components/BlockActionPanel";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import HTMLActions from "@ext/markdown/elements/html/edit/components/HTMLActions";
import HTML from "@ext/markdown/elements/html/render/components/HTML";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useRef } from "react";

const HTMLComponent = ({ node, getPos, editor, updateAttributes }: NodeViewProps): ReactElement => {
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
		<NodeViewWrapper ref={hoverElement} as={"div"} data-qa="qa-html">
			<BlockActionPanel
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				getPos={getPos}
				rightActions={
					isEditable && <HTMLActions editor={editor} node={node} getPos={getPos} openEditor={openEditor} />
				}
			>
				<HTML mode={node.attrs.mode} content={node.attrs.content} />
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};

export default HTMLComponent;
