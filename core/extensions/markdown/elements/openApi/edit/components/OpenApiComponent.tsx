import BlockActionPanel from "@components/BlockActionPanel";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useRef } from "react";

const OpenApiComponent = ({ node, getPos, selected, editor, updateAttributes }: NodeViewProps): ReactElement => {
	const isSelected = selected && editor.state.selection.from + 1 === editor.state.selection.to;
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	return (
		<NodeViewWrapper ref={hoverElement} as={"div"} draggable={true} data-drag-handle>
			<BlockActionPanel
				getPos={getPos}
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				selected={isSelected}
				rightActions={
					isEditable && (
						<OpenApiActions
							editor={editor}
							node={node}
							getPos={getPos}
							updateAttributes={updateAttributes}
						/>
					)
				}
			>
				<OpenApi {...node.attrs} />
			</BlockActionPanel>
		</NodeViewWrapper>
	);
};

export default OpenApiComponent;
