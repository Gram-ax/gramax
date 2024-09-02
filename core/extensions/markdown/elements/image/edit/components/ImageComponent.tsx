import Image from "@ext/markdown/elements/image/edit/components/Image";
import { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { ReactElement } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const ImageComponent = (props: NodeViewProps): ReactElement => {
	const { editor, node, getPos, selected } = props;

	const updateAttributes = (attributes: Record<string, any>) => {
		const tr = editor.view.state.tr;
		const pos = getPos();

		Object.keys(attributes).forEach((key) => {
			tr.setNodeAttribute(pos, key, attributes[key]);
		});

		editor.view.dispatch(tr);
	};

	return (
		<NodeViewWrapper draggable={true} data-drag-handle>
			<Focus getPos={getPos}>
				<Image editor={editor} updateAttributes={updateAttributes} selected={selected} node={node} />
			</Focus>
		</NodeViewWrapper>
	);
};

export default ImageComponent;
