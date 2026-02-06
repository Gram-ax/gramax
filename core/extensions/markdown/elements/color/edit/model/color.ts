import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark } from "@tiptap/core";
import schema from "./colorSchema";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		color: {
			toggleColor: () => ReturnType;
		};
	}
}

export const Color = Mark.create({
	...getExtensionOptions({ schema: schema, name: "color" }),

	parseHTML() {
		return [
			{
				tag: "span[data-color]",
				getAttrs: (element) => ({
					color: element.getAttribute("data-color"),
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
				"data-color": color,
				style: `color: ${color}`,
			},
			0,
		];
	},

	addCommands() {
		return {
			toggleColor:
				() =>
				({ commands }) => {
					return commands.toggleMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("toggleColor", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("toggleColor")] },
			],
			this.type.name,
		);
	},
});

export default Color;
