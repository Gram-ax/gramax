import Image from "@ext/markdown/elements/image/edit/components/Image";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";

const ImageComponent = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos, selected } = props;
	const isSelected = selected && editor.state.selection.from + 1 === editor.state.selection.to;

	const updateAttributes = (attributes: Record<string, any>) => {
		const tr = editor.view.state.tr;
		const pos = getPos();

		Object.keys(attributes).forEach((key) => {
			tr.setNodeAttribute(pos, key, attributes[key]);
		});

		editor.view.dispatch(tr);
	};

	return (
		<NodeViewWrapper draggable={true} data-drag-handle className="focus-pointer-events">
			<Image editor={editor} updateAttributes={updateAttributes} selected={isSelected} node={node} />
		</NodeViewWrapper>
	);
};

export default ImageComponent;
