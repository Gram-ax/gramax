import { toggleList } from "@ext/markdown/elements/list/edit/logic/toggleList";
import SelectionBackspace from "@ext/markdown/elements/list/edit/models/listItem/logic/keys/SelectionBackspace";
import { ordered_list } from "@ext/markdown/elements/list/edit/models/orderList/model/orderListSchema";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";

interface OrderedListOptions {
	itemTypeName: string;
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		orderedList: {
			/**
			 * Toggle an ordered list
			 */
			toggleOrderedList: () => ReturnType;
		};
	}
}

const inputRegex = /^(\d+)\.\s$/;

const OrderedList = Node.create<OrderedListOptions>({
	...getExtensionOptions({ schema: ordered_list, name: "ordered_list", withAttributes: false }),

	addOptions() {
		return {
			itemTypeName: "list_item",
			HTMLAttributes: {},
		};
	},

	addAttributes() {
		return {
			start: {
				default: 1,
				parseHTML: (element) => {
					return element.hasAttribute("start") ? parseInt(element.getAttribute("start") || "", 10) : 1;
				},
			},
		};
	},

	parseHTML() {
		return [
			{
				tag: "ol",
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		const { start, ...attributesWithoutStart } = HTMLAttributes;

		return start === 1
			? ["ol", mergeAttributes(this.options.HTMLAttributes, attributesWithoutStart), 0]
			: ["ol", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleOrderedList:
				() =>
				({ commands, editor, dispatch }) => {
					const mainToggle = commands.toggleList(this.name, this.options.itemTypeName);
					const secondToggle = toggleList({ editor, dispatch, listName: this.name });

					return mainToggle || secondToggle;
				},
		};
	},

	addKeyboardShortcuts() {
		return {
			"Mod-Shift-7": () => this.editor.commands.toggleOrderedList(),
			...addShortcuts([SelectionBackspace()]),
		};
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: inputRegex,
				type: this.type,
				getAttributes: (match) => ({ start: +match[1] }),
				joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
			}),
		];
	},
});

export default OrderedList;
