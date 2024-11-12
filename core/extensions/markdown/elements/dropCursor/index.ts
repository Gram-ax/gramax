import { DropCursorView } from "@ext/markdown/elements/dropCursor/dropcursor";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface DropcursorOptions {
	color: string | undefined;
	width: number | undefined;
	class: string | undefined;
}

export const Dropcursor = Extension.create({
	name: "dropCursor",

	addOptions() {
		return {
			color: "var(--color-primary-general)",
			width: 2,
			class: undefined,
		};
	},

	addProseMirrorPlugins() {
		const options = this.options;
		return [
			new Plugin({
				props: {
					handleDrop: (_1, _2, slice) => {
						let cantDrop = false;
						slice.content.forEach((node) => {
							if (!cantDrop && node.type.name === "view") cantDrop = true;
						});
						return cantDrop;
					},
				},
				view(editorView) {
					return new DropCursorView(editorView, options);
				},
			}),
		];
	},
});
