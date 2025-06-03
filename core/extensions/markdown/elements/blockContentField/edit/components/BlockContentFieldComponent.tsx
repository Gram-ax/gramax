import { NodeViewWrapper, NodeViewProps, NodeViewContent } from "@tiptap/react";
import BlockWrapper from "./BlockWrapper";
import { useState, useRef, ChangeEvent, useCallback } from "react";

const BlockContentFieldComponent = ({ node, extension, updateAttributes }: NodeViewProps) => {
	const [isEditable] = useState(extension.options.editable);
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const placeholder = node.attrs.placeholder;

	const updatePlaceholder = useCallback(
		(text: string) => {
			updateAttributes({ placeholder: text });
		},
		[updateAttributes],
	);

	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value;
			updatePlaceholder(value);
		},
		[updatePlaceholder],
	);

	return (
		<NodeViewWrapper ref={hoverElementRef}>
			<BlockWrapper readOnly={!isEditable}>
				{isEditable ? <NodeViewContent /> : <input type="text" value={placeholder} onChange={onChange} />}
			</BlockWrapper>
		</NodeViewWrapper>
	);
};

export default BlockContentFieldComponent;
