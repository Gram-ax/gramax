import BlockActionPanel from "@components/BlockActionPanel";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef } from "react";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

const OpenApiComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	return (
		<NodeViewContextableWrapper ref={hoverElement} props={props} draggable={true} data-drag-handle>
			<BlockActionPanel
				getPos={getPos}
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				actionsOptions={{ comment: true }}
				selected={false}
				rightActions={
					isEditable && <OpenApiActions editor={editor} node={node} updateAttributes={updateAttributes} />
				}
			>
				<OpenApi {...node.attrs} commentId={node.attrs.comment?.id} />
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default OpenApiComponent;
