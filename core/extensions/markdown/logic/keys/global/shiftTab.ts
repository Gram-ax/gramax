import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const getShiftTabShortcuts = (): KeyboardShortcut => {
	return { key: "Shift-Tab", rules: [() => true] };
};

export default getShiftTabShortcuts;
