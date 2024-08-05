import getSelectedText from "@ext/markdown/elementsUtils/getSelectedText";
import addShortcuts from "@ext/markdown/elementsUtils/keyboardShortcuts/addShortcuts";
import space from "@ext/markdown/logic/keys/marks/space";
import { Mark, mergeAttributes } from "@tiptap/core";
import { editTooltip } from "./helpers/editTooltip";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		file: {
			toggleFile: (attributes: { href: string; target?: string }) => ReturnType;
			unsetFile: () => ReturnType;
		};
	}
}

export const File = Mark.create({
	name: "file",

	priority: 1000,

	keepOnSplit: false,

	addOptions() {
		return { HTMLAttributes: {} };
	},

	addAttributes() {
		return {
			href: { default: null },
			isFile: { default: true },
			resourcePath: { default: null },
			class: { default: this.options.HTMLAttributes.class },
		};
	},

	parseHTML() {
		return [{ tag: "gr-file" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["gr-file", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			toggleFile:
				(attributes) =>
				({ chain, editor, state }) => {
					if (getSelectedText(state)) {
						return chain()
							.toggleMark(this.name, attributes)
							.focus(editor.state.tr.selection.to - 1)
							.run();
					}
					return chain().toggleMark(this.name, attributes).run();
				},
			unsetFile:
				() =>
				({ chain }) => {
					return chain().unsetMark(this.name).run();
				},
		};
	},

	addProseMirrorPlugins() {
		return [editTooltip(this.editor, this.options.apiUrlCreator, this.options.pageDataContext)];
	},

	addKeyboardShortcuts() {
		return addShortcuts(
			[{ key: "Space", focusShouldBeInsideNode: false, rules: [space("unsetFile")] }],
			this.type.name,
		);
	},
});

export default File;
