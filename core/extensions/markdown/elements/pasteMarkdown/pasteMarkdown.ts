import handlePasteMarkdown, { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/logic/handlePasteMarkdown";
import { hasSemanticHtml } from "@ext/markdown/elements/pasteMarkdown/logic/hasSemanticHtml";
import { Extension } from "@tiptap/core";
import type { Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

const isInTextBlock = (view: EditorView): boolean => {
	const curNode = view.state.selection.$from.node();
	if (curNode.type.spec.content.includes("text")) return false;
	return true;
};

const shouldHandlePaste = (event: ClipboardEvent, slice: Slice): boolean => {
	const clipboardData = event.clipboardData;
	if (!clipboardData || clipboardData.files.length > 0 || clipboardData.getData("text/gramax")) return false;

	const text = clipboardData.getData("text/plain");
	if (!isMarkdownText(text)) return false;

	return !clipboardData.getData("text/html") || !hasSemanticHtml(slice);
};

const pasteMarkdown = Extension.create({
	name: "pasteMarkdown",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("pasteMarkdown"),
				props: {
					handlePaste(view, event, slice) {
						if (shouldHandlePaste(event, slice) && isInTextBlock(view)) {
							void handlePasteMarkdown(view, event, slice);
							return true;
						}

						return false;
					},
				},
			}),
		];
	},
});

export default pasteMarkdown;
