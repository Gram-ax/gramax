import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ChangeEvent, useCallback, useRef, useState } from "react";
import BlockWrapper from "./BlockWrapper";

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
				{isEditable ? <NodeViewContent /> : <input onChange={onChange} type="text" value={placeholder} />}
			</BlockWrapper>
		</NodeViewWrapper>
	);
};

export default BlockContentFieldComponent;
