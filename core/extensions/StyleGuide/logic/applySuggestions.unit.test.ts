import applySuggestions from "@ext/StyleGuide/logic/applySuggestions";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0] },
		text: { group: "inline" },
		image: { group: "inline", inline: true, attrs: { src: {} }, toDOM: () => ["img"] },
	},
	marks: {
		comment: { attrs: { id: { default: null } } },
		strong: {},
		suggestion: {
			attrs: {
				text: { default: null },
				name: { default: null },
				description: { default: null },
				originalText: { default: null },
			},
		},
	},
});

const suggestionHtml = (before: string, marked: string, after: string, replacement: string) =>
	`${before}<suggestion name="rule" description="why" text="${replacement}">${marked}</suggestion>${after}`;

const getSuggestionRanges = (doc) => {
	const ranges: { from: number; to: number; text: string; attrs: Record<string, unknown> }[] = [];
	doc.descendants((node, pos) => {
		const mark = node.marks.find((m) => m.type.name === "suggestion");
		if (mark) ranges.push({ from: pos, to: pos + node.nodeSize, text: node.text, attrs: mark.attrs });
	});
	return ranges;
};

const apply = (doc, items) => {
	const state = EditorState.create({ doc, schema });
	const tr = applySuggestions(state.tr, schema.marks.suggestion, items);
	return state.apply(tr).doc;
};

describe("applySuggestions", () => {
	it("marks the fragment without touching comments", () => {
		const comment = schema.marks.comment.create({ id: "c1" });
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [schema.text("Мы делаем ошибку тут.", [comment])]),
		]);

		const result = apply(doc, [
			{ suggestion: suggestionHtml("Мы делаем ", "ошибку", " тут.", "правку"), originalSentence: null },
		]);

		const ranges = getSuggestionRanges(result);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].text).toBe("ошибку");
		expect(ranges[0].attrs.text).toBe("правку");
		expect(ranges[0].attrs.originalText).toBe("ошибку");
		expect(result.textContent).toBe("Мы делаем ошибку тут.");

		let commentedText = "";
		result.descendants((node) => {
			if (node.marks.some((m) => m.type.name === "comment")) commentedText += node.text;
		});
		expect(commentedText).toBe("Мы делаем ошибку тут.");
	});

	it("keeps inline images and formatting", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [
				schema.text("Тут "),
				schema.node("image", { src: "a.png" }),
				schema.text(" будет "),
				schema.text("ошибка", [schema.marks.strong.create()]),
				schema.text(" точно."),
			]),
		]);

		const result = apply(doc, [
			{ suggestion: suggestionHtml("Тут  будет ", "ошибка", " точно.", "верно"), originalSentence: null },
		]);

		const images = [];
		result.descendants((node) => {
			if (node.type.name === "image") images.push(node.attrs.src);
		});
		expect(images).toEqual(["a.png"]);

		const ranges = getSuggestionRanges(result);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].text).toBe("ошибка");
		expect(result.textBetween(ranges[0].from, ranges[0].to)).toBe("ошибка");

		let boldText = "";
		result.descendants((node) => {
			if (node.marks.some((m) => m.type.name === "strong")) boldText += node.text;
		});
		expect(boldText).toBe("ошибка");
	});

	it("marks a whitespace-only fix", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [schema.text("Внутри повтор  , повтор")]),
		]);

		const result = apply(doc, [
			{
				suggestion: suggestionHtml("Внутри повтор", "  ", ", повтор", " "),
				originalSentence: null,
			},
		]);

		const ranges = getSuggestionRanges(result);
		expect(ranges).toHaveLength(1);
		expect(result.textBetween(ranges[0].from, ranges[0].to)).toBe("  ");
	});

	it("skips a fix whose range would swallow an inline node", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [
				schema.text("Внутри повтор "),
				schema.node("image", { src: "a.png" }),
				schema.text(" , повтор"),
			]),
		]);

		const result = apply(doc, [
			{ suggestion: suggestionHtml("Внутри повтор", "  ", ", повтор", " "), originalSentence: null },
		]);

		expect(getSuggestionRanges(result)).toHaveLength(0);
	});

	it("does not change anything when the sentence is not found", () => {
		const doc = schema.node("doc", null, [schema.node("paragraph", null, [schema.text("Совсем другой текст.")])]);

		const result = apply(doc, [
			{ suggestion: suggestionHtml("Мы делаем ", "ошибку", " тут.", "правку"), originalSentence: null },
		]);

		expect(getSuggestionRanges(result)).toHaveLength(0);
		expect(result.textContent).toBe("Совсем другой текст.");
	});
});
