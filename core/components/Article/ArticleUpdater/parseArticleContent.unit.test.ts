import parseArticleContent from "./parseArticleContent";

// The live-update payload's `content` is a string, but the tauri IPC transport can
// deliver the literal "undefined" when the document is effectively empty. That passes
// the caller's `typeof content === "string"` guard, so JSON.parse used to throw
// `SyntaxError: "undefined" is not valid JSON` (Bugsnag 6a50b4fe).
test('returns null for the literal string "undefined" instead of throwing', () => {
	expect(parseArticleContent("undefined")).toBeNull();
});

test("returns null for other non-JSON payloads instead of throwing", () => {
	expect(parseArticleContent("")).toBeNull();
	expect(parseArticleContent("not json")).toBeNull();
});

test("parses a valid serialized document", () => {
	const doc = { type: "doc", content: [{ type: "paragraph", content: [] }] };
	expect(parseArticleContent(JSON.stringify(doc))).toEqual(doc);
});
