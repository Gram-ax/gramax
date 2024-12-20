import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

interface HTMLActionsProps {
	editor: Editor;
	node: Node;
	getPos: () => number;
	openEditor: () => void;
}

const HTMLActions = ({ editor, node, getPos, openEditor }: HTMLActionsProps) => {
	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	return (
		<>
			<ActionButton icon="pencil" tooltipText={t("edit")} onClick={openEditor} />
			<ActionButton icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
		</>
	);
};

export default HTMLActions;
