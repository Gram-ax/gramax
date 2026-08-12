import type { JSONContent } from "@tiptap/core";

// Parse the serialized document a live update pushes to the active article into
// ProseMirror JSON. Returns null when the payload is not valid JSON — e.g. the literal
// string "undefined" the tauri IPC transport can deliver for an effectively empty
// document, which passes the caller's `typeof content === "string"` guard but is not
// valid JSON — so the caller skips the update instead of throwing (Bugsnag 6a50b4fe).
export const parseArticleContent = (content: string): JSONContent | null => {
	try {
		return JSON.parse(content) as JSONContent;
	} catch {
		return null;
	}
};

export default parseArticleContent;
