import { pasteBetweenMark } from "@ext/markdown/elements/copyArticles/plugins/pasteBetweenMark";
import { Fragment, Slice } from "@tiptap/pm/model";
import { schema } from "@tiptap/pm/schema-basic";
import { EditorState, TextSelection } from "@tiptap/pm/state";

const { doc: docNode, paragraph, blockquote, code_block, hard_break } = schema.nodes;

const makeState = (doc: ReturnType<typeof docNode.create>, pos: number): EditorState => {
	const sel = TextSelection.create(doc, pos);
	return EditorState.create({ schema, doc, selection: sel });
};

const paraSlice = (text: string, marks: ReturnType<typeof schema.marks.strong.create>[] = []) =>
	new Slice(Fragment.from(paragraph.create(null, [schema.text(text, marks)])), 0, 0);

describe("pasteBetweenMark", () => {
	test("non-collapsed selection returns slice unchanged", () => {
		const doc = docNode.create(null, [paragraph.create(null, [schema.text("hello world")])]);
		const sel = TextSelection.create(doc, 2, 6);
		const state = EditorState.create({ schema, doc, selection: sel });
		const slice = paraSlice("test");
		expect(pasteBetweenMark(slice, state)).toBe(slice);
	});

	test("empty slice (childCount === 0) returns slice unchanged — regression f089151", () => {
		const doc = docNode.create(null, [paragraph.create()]);
		const state = makeState(doc, 1);
		const emptySlice = new Slice(Fragment.empty, 0, 0);
		expect(pasteBetweenMark(emptySlice, state)).toBe(emptySlice);
	});

	test("null firstChild returns slice unchanged — regression for TypeError fix", () => {
		const doc = docNode.create(null, [paragraph.create()]);
		const state = makeState(doc, 1);
		const mockSlice = new Slice(Fragment.from(paragraph.create(null, [schema.text("test")])), 0, 0);
		Object.defineProperty(mockSlice.content, "firstChild", { get: () => null, configurable: true });
		expect(pasteBetweenMark(mockSlice, state)).toBe(mockSlice);
	});

	test("non-textblock firstChild (blockquote) returns slice unchanged", () => {
		const doc = docNode.create(null, [paragraph.create()]);
		const state = makeState(doc, 1);
		const slice = new Slice(
			Fragment.from(blockquote.create(null, [paragraph.create(null, [schema.text("quoted")])])),
			0,
			0,
		);
		expect(pasteBetweenMark(slice, state)).toBe(slice);
	});

	test("code block firstChild returns slice unchanged", () => {
		const doc = docNode.create(null, [paragraph.create()]);
		const state = makeState(doc, 1);
		const slice = new Slice(Fragment.from(code_block.create(null, [schema.text("const x = 1;")])), 0, 0);
		expect(pasteBetweenMark(slice, state)).toBe(slice);
	});

	test("applies active marks from cursor position to pasted text", () => {
		const boldMark = schema.marks.strong.create();
		const doc = docNode.create(null, [paragraph.create(null, [schema.text("hello", [boldMark])])]);
		const state = makeState(doc, 4);

		const result = pasteBetweenMark(paraSlice("world"), state);

		expect(result.content.firstChild!.firstChild!.marks.some((m) => m.type === schema.marks.strong)).toBe(true);
	});

	test("replaces marks on pasted text with active marks at cursor (strips when none active)", () => {
		const boldMark = schema.marks.strong.create();
		const doc = docNode.create(null, [paragraph.create(null, [schema.text("hello")])]);
		const state = makeState(doc, 4);

		const result = pasteBetweenMark(paraSlice("world", [boldMark]), state);

		expect(result.content.firstChild!.firstChild!.marks).toHaveLength(0);
	});

	test("preserves non-text inline nodes (e.g. hard_break) and applies marks to surrounding text", () => {
		const boldMark = schema.marks.strong.create();
		const doc = docNode.create(null, [paragraph.create(null, [schema.text("hello", [boldMark])])]);
		const state = makeState(doc, 4);
		const slice = new Slice(
			Fragment.from(paragraph.create(null, [schema.text("before"), hard_break.create(), schema.text("after")])),
			0,
			0,
		);

		const result = pasteBetweenMark(slice, state);
		const resultPara = result.content.firstChild!;

		expect(resultPara.child(1).type.name).toBe("hard_break");
		expect(resultPara.child(0).marks.some((m) => m.type === schema.marks.strong)).toBe(true);
		expect(resultPara.child(2).marks.some((m) => m.type === schema.marks.strong)).toBe(true);
	});
});
