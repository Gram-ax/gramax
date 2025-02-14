import handlePasteMarkdown, { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/handlePasteMarkdown";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const pasteMarkdown = Extension.create({
	name: "pasteMarkdown",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("pasteMarkdown"),
				props: {
					handlePaste(view, event, slice) {
						const text = event.clipboardData?.getData("text/plain");
						const isMarkdown = isMarkdownText(text);

						if (!text || (text && event.clipboardData?.types.length > 1) || !isMarkdown) return;
						void handlePasteMarkdown(view, event, slice);

						return true;
					},
				},
			}),
		];
	},
});

export default pasteMarkdown;
