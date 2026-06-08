import type { Level } from "@ext/markdown/elements/heading/edit/model/heading";
import type { Editor } from "@tiptap/core";

// ProseMirror document structure for a list item:
//   doc (depth 0) → list (depth 1) → listItem (depth 2) → paragraph (depth 3+)

const LIST_TYPES = ["bulletList", "orderedList", "taskList"];

const listItemToHeading = (editor: Editor, level: Level): boolean => {
	const { $from } = editor.state.selection;

	const cursorIsInsideListItem = $from.depth >= 2 && $from.node(2).type.name === "listItem";
	const listItemsParentIsList = LIST_TYPES.includes($from.node(1).type.name);

	if (!cursorIsInsideListItem || !listItemsParentIsList) return false;

	return editor.chain().liftListItem("listItem").setNode("heading", { level }).run();
};

export default listItemToHeading;
