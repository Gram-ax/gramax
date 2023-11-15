import { list_item } from "@ext/markdown/elements/list/edit/models/listItem/model/listItemSchema";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import getBackspaceShortcuts from "../logic/keys/Backspace";
import getDeleteShortcuts from "../logic/keys/Delete";
import getEnterShortcuts from "../logic/keys/Enter";
import getShiftTabShortcuts from "../logic/keys/ShiftTab";
import getTabShortcuts from "../logic/keys/Tab";

interface ListItemOptions {
	HTMLAttributes: Record<string, any>;
}

const ListItem = Node.create<ListItemOptions>({
	...getExtensionOptions({ schema: list_item, name: "list_item", withAttributes: false }),

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: "li" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["li", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				getBackspaceShortcuts(),
				getShiftTabShortcuts(),
				getDeleteShortcuts(),
				getEnterShortcuts(),
				getTabShortcuts(),
			],
			this.name,
		);
	},
});

export default ListItem;
