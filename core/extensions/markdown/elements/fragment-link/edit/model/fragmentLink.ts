import { fragmentLinkHoverPlugin } from "@ext/markdown/elements/fragment-link/edit/logic/FragmentLinkHoverPlugin";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import arrowRight from "@ext/markdown/logic/keys/marks/arrowRight";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark } from "@tiptap/core";
import fragmentLinkSchema from "./fragmentLinkSchema";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		"fragment-link": {
			setFragmentLink: (attrs: { id: string }) => ReturnType;
			unsetFragmentLink: () => ReturnType;
		};
	}
}

export const FragmentLink = Mark.create({
	...getExtensionOptions({ schema: fragmentLinkSchema, name: "fragment-link" }),

	addProseMirrorPlugins() {
		return [fragmentLinkHoverPlugin(this.editor)];
	},

	inclusive() {
		return false;
	},

	parseHTML() {
		return [
			{
				tag: "span[data-fragment-link]",
				getAttrs: (element) => ({
					id: (element as HTMLElement).getAttribute("data-fragment-link"),
				}),
			},
		];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"span",
			{
				"data-fragment-link": HTMLAttributes.id,
				class: "fragment-link-mark",
			},
			0,
		];
	},

	addCommands() {
		return {
			setFragmentLink:
				(attrs) =>
				({ commands }) => {
					return commands.setMark(this.name, attrs);
				},
			unsetFragmentLink:
				() =>
				({ commands }) => {
					return commands.unsetMark(this.name);
				},
		};
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[
				{ key: "Space", focusShouldBeInsideNode: false, rules: [space("unsetFragmentLink", this.type.name)] },
				{ key: "ArrowRight", focusShouldBeInsideNode: false, rules: [arrowRight("unsetFragmentLink")] },
			],
			this.type.name,
		);
	},
});

export default FragmentLink;
