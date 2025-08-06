import { Mark } from "@tiptap/core";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import schema from "./schema";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";
import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		highlight: {
			setHighlight: (attributes: { color: string }) => ReturnType;
			toggleHighlight: () => ReturnType;
			unsetHighlight: () => ReturnType;
		};
	}
}

export const Highlight = Mark.create({
	priority: 1001,
	...getExtensionOptions({ schema: schema, name: "highlight" }),

	parseHTML() {
		return [
			{
				tag: "span[data-highlight]",
				getAttrs: (element) => ({
					color: element.getAttribute("data-highlight"),
				}),
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		const { color } = HTMLAttributes;
		if (!color) return ["span", {}, 0];

		return [
			"span",
			{
				"data-highlight": color,
				style: `background-color: var(--color-highlight-${color});border-radius: var(--radius-medium);color: black;padding: 2px 2px;`,
			},
			0,
		];
	},

	addCommands() {
		return {
			setHighlight:
				(attributes) =>
				({ chain, state }) => {
					if (!getSelectedText(state)) return false;
					return chain().toggleMark(this.name, attributes, { extendEmptyMarkRange: true }).run();
				},

			toggleHighlight:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},

			unsetHighlight:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("toggleHighlight", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("toggleHighlight")] },
			],
			this.type.name,
		);
	},
});

export default Highlight;
