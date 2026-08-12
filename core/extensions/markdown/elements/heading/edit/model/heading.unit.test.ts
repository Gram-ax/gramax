import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror";
import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import { Editor } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import Heading from "./heading";

describe("Heading IDs", () => {
	test("assigns unique IDs to identical headings when the editor opens", () => {
		const element = document.createElement("div");
		document.body.append(element);
		const content = {
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { level: 2, id: null, isCustomId: false },
					content: [{ type: "text", text: "Section" }],
				},
				{
					type: "heading",
					attrs: { level: 2, id: null, isCustomId: false },
					content: [{ type: "text", text: "Section" }],
				},
			],
		};
		editTreeToRenderTree(content, getSchema());
		const onUpdate = jest.fn();
		const editor = new Editor({
			element,
			content,
			extensions: [Document, Heading, Text],
			onUpdate,
		});

		expect(editor.state.doc.child(0).attrs.id).toBe("section");
		expect(editor.state.doc.child(1).attrs.id).toBe("section-1");
		expect(editor.getHTML()).toContain('id="section-1"');
		expect(onUpdate).not.toHaveBeenCalled();

		editor.destroy();
	});

	test("assigns a unique ID to an identical heading created in the editor", () => {
		const element = document.createElement("div");
		document.body.append(element);
		const editor = new Editor({
			element,
			content: {
				type: "doc",
				content: [
					{
						type: "heading",
						attrs: { level: 2, id: null, isCustomId: false },
						content: [{ type: "text", text: "Section" }],
					},
					{
						type: "heading",
						attrs: { level: 2, id: null, isCustomId: false },
						content: [{ type: "text", text: "Sectio" }],
					},
				],
			},
			extensions: [Document, Heading, Text],
		});

		const secondHeadingPosition = editor.state.doc.child(0).nodeSize;
		const secondHeadingEnd = secondHeadingPosition + editor.state.doc.child(1).nodeSize - 1;
		editor.chain().setTextSelection(secondHeadingEnd).insertContent("n").run();

		expect(editor.state.doc.child(0).attrs.id).toBeNull();
		expect(editor.state.doc.child(1).attrs.id).toBe("section-1");
		expect(editor.getHTML()).toContain('id="section-1"');

		editor.destroy();
	});
});
