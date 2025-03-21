import { UnionCommands } from "@tiptap/core";
import getFocusMark from "../../../elementsUtils/getFocusMark";
import KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";

const markCommandsMap = new Map<string, keyof UnionCommands>();
const space = (toggleCommand: keyof UnionCommands, markName: string): KeyboardRule => {
	markCommandsMap.set(markName, toggleCommand);
	return ({ typeName, editor }) => {
		const { position, marks } = getFocusMark(editor.state, typeName);
		if (!position) return false;

		const markNode = editor.state.doc.nodeAt(position);

		if (!markNode || !(markNode.text.endsWith(String.fromCharCode(160)) || markNode.text.endsWith(" "))) {
			return false;
		}
		if (position + markNode.nodeSize - editor.state.selection.anchor > 2) return false;

		const removeSpaces = editor
			.chain()
			.focus()
			.insertContentAt(
				{ from: position - 1, to: position - 1 + markNode.text.length },
				markNode.text.slice(0, markNode.text.length - 1),
			)
			.run();

		const toggle = marks.every((mark) => {
			const command = markCommandsMap.get(mark.type.name);
			if (!command) return true;
			return (editor.commands[command] as () => boolean)();
		});

		const addSpaceAfter = editor
			.chain()
			.focus()
			.insertContentAt(
				{ from: editor.state.selection.from, to: editor.state.selection.to },
				String.fromCharCode(160),
			)
			.run();
		return removeSpaces && toggle && addSpaceAfter;
	};
};

export default space;
