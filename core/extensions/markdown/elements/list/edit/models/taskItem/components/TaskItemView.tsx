import ListItem from "@ext/markdown/elements/list/render/ListItem";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { FC, ChangeEvent } from "react";

const TaskItemView: FC<NodeViewProps> = ({ node, editor, updateAttributes, getPos }) => {
	const { checked } = node.attrs;
	const onChangeHandler = (event: ChangeEvent<HTMLInputElement>) => {
		const { checked } = event.target;

		if (editor?.isEditable && typeof getPos === "function") {
			updateAttributes({ checked });
		} else {
			event.target.checked = !checked;
		}
	};

	return (
		<NodeViewWrapper>
			<ListItem checked={checked} onChangeHandler={onChangeHandler} isTaskItem>
				<NodeViewContent />
			</ListItem>
		</NodeViewWrapper>
	);
};

export default TaskItemView;
