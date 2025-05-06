import handlePasteMarkdown, { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";

const isInTextBlock = (view: EditorView): boolean => {
	const curNode = view.state.selection.$from.node();
	if (curNode.type.spec.content.includes("text")) return false;
	return true;
};

const shouldHandlePaste = (event: ClipboardEvent): boolean => {
	const text = event.clipboardData?.getData("text/plain");
	const isMarkdown = isMarkdownText(text);
	return text && event.clipboardData?.types.length === 1 && isMarkdown;
};

const pasteMarkdown = Extension.create({
	name: "pasteMarkdown",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("pasteMarkdown"),
				props: {
					handlePaste(view, event, slice) {
						if (shouldHandlePaste(event) && isInTextBlock(view)) {
							void handlePasteMarkdown(view, event, slice);
							return true;
						}
					},
				},
			}),
		];
	},
});

export default pasteMarkdown;
