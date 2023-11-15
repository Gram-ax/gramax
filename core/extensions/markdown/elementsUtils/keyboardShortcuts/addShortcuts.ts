import { KeyboardShortcutCommand } from "@tiptap/core";
import applyKeyboardRules from "./applyKeyboardRules";
import KeyboardShortcut from "./model/KeyboardShortcut";

const addShortcuts = (
	keyboardShortcuts: KeyboardShortcut[],
	typeName?: string,
): { [key: string]: KeyboardShortcutCommand } => {
	const keyboardShortcutsObject: { [key: string]: KeyboardShortcutCommand } = {};

	keyboardShortcuts.forEach((shortcut) => {
		keyboardShortcutsObject[shortcut.key] = applyKeyboardRules(
			shortcut.rules,
			shortcut.focusShouldBeInsideNode,
			typeName,
		);
	});

	return keyboardShortcutsObject;
};

export default addShortcuts;
