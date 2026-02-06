import BlockActionPanel from "@components/BlockActionPanel";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps } from "@tiptap/react";
import { ReactElement, useRef } from "react";

const OpenApiComponent = (props: NodeViewProps): ReactElement => {
	const { node, getPos, editor, updateAttributes } = props;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	return (
		<NodeViewContextableWrapper data-drag-handle draggable={true} props={props} ref={hoverElement}>
			<BlockActionPanel
				actionsOptions={{ comment: true }}
				getPos={getPos}
				hoverElementRef={hoverElement}
				rightActions={
					isEditable && <OpenApiActions editor={editor} node={node} updateAttributes={updateAttributes} />
				}
				selected={false}
				updateAttributes={updateAttributes}
			>
				<OpenApi {...node.attrs} commentId={node.attrs.comment?.id} />
			</BlockActionPanel>
		</NodeViewContextableWrapper>
	);
};

export default OpenApiComponent;
