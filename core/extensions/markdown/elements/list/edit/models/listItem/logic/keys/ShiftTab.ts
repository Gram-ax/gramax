import KeyboardShortcut from "../../../../../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const getShiftTabShortcuts = (): KeyboardShortcut => {
	return { key: "Shift-Tab", rules: [({ editor, typeName }) => editor.commands.liftListItem(typeName)] };
};

export default getShiftTabShortcuts;
