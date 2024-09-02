import { getLines } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/getLines";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { Node } from "prosemirror-model";

const tab: KeyboardRule = ({ editor, typeName }) => {
	const { state } = editor;
	const { $from, $to } = state.selection;
	if ($from.parent.type.name !== typeName) return false;
	const isSelected = $from.pos !== $to.pos;
	const positions: number[] = [];
	const tab = Node.fromJSON(editor.schema, { type: "text", text: "	" });
	if (isSelected) {
		const { lines, startPosition } = getLines(state);
		positions.push(startPosition);
		lines.slice(0, -1).forEach((line, idx) => {
			positions.push(positions[idx] + line.length + 1);
		});
	}

	return editor
		.chain()
		.command(({ tr }) => {
			if (!isSelected) tr.insert($from.pos, tab);
			else positions.reverse().forEach((pos) => tr.insert(pos, tab));
			return true;
		})
		.run();
};

const getTabShortcuts = (): KeyboardShortcut => {
	return {
		key: "Tab",
		rules: [tab],
	};
};

export default getTabShortcuts;
