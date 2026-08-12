import type { Editor } from "@tiptap/core";

// True when contentJson builds a document structurally identical to the editor's
// current document. Uses ProseMirror's Node.eq (not string compare) so serialization
// or key-order differences cannot produce a false "changed" that needlessly resets
// focus. On any parse/build error returns false, so the caller still applies the update.
export const isUnchangedContent = (editor: Editor, contentJson: unknown): boolean => {
	try {
		const incoming = editor.schema.nodeFromJSON(contentJson as never);
		return editor.state.doc.eq(incoming);
	} catch {
		return false;
	}
};
