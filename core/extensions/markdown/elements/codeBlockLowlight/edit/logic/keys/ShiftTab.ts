import { getLines } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/getLines";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const shiftTab: KeyboardRule = ({ editor, typeName }) => {
	const state = editor.state;
	if (state.selection.$from.parent.type.name !== typeName) return false;
	const positions: number[] = [];
	const { lines, startPosition } = getLines(state);
	positions.push(startPosition);
	lines.slice(0, -1).forEach((line, idx) => {
		positions.push(positions[idx] + line.length + 1);
	});
	const resPos = positions.map((p, idx) => (lines[idx][0] === "	" ? p : null)).filter((p) => p);
	return editor
		.chain()
		.command(({ tr }) => {
			resPos.reverse().forEach((pos) => tr.delete(pos, pos + 1));
			return true;
		})
		.run();
};
const getShiftTabShortcuts = (): KeyboardShortcut => {
	return {
		key: "Shift-Tab",
		rules: [shiftTab],
	};
};

export default getShiftTabShortcuts;
