import BlockActionPanel from "@components/BlockActionPanel";
import OpenApiActions from "@ext/markdown/elements/openApi/edit/components/OpenApiActions";
import OpenApi from "@ext/markdown/elements/openApi/render/OpenApi";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useRef } from "react";

const OpenApiComponent = ({ node, getPos, editor, updateAttributes }: NodeViewProps): ReactElement => {
	const hoverElement = useRef<HTMLDivElement>(null);
	const isEditable = editor.isEditable;

	return (
		<NodeViewWrapper ref={hoverElement} as={"div"} draggable={true} data-drag-handle>
			<BlockActionPanel
				getPos={getPos}
				updateAttributes={updateAttributes}
				hoverElementRef={hoverElement}
				selected={false}
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
