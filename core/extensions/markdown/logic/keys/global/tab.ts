import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const getTabShortcuts = (): KeyboardShortcut => {
	return { key: "Tab", rules: [() => true] };
};

export default getTabShortcuts;
