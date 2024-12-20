import BlockActionPanel from "@components/BlockActionPanel";
import CodeBlockActions from "@ext/markdown/elements/codeBlockLowlight/edit/component/CodeBlockActions";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useRef } from "react";

const CodeBlockComponent = (props: NodeViewProps) => {
	const { node, editor, getPos, updateAttributes } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	return (
		<NodeViewWrapper ref={hoverElement}>
			<BlockActionPanel
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				getPos={getPos}
				rightActions={
					isEditable && (
						<CodeBlockActions
							updateAttributes={updateAttributes}
							editor={editor}
							node={node}
							getPos={getPos}
						/>
					)
				}
			>
				<pre>
					<NodeViewContent />
				</pre>
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};

export default CodeBlockComponent;
