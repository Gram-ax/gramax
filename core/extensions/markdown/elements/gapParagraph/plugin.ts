import { Extension } from "@tiptap/core";
import { gapParagraph as gapParagraphPlugin } from "./utils";

const gapParagraph = Extension.create({
	name: "gapParagraph",

	addProseMirrorPlugins() {
		return [gapParagraphPlugin()];
	},
});

export default gapParagraph;
