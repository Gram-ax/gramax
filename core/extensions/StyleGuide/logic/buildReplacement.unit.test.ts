import buildReplacement from "@ext/StyleGuide/logic/buildReplacement";
import { Schema } from "prosemirror-model";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0] },
		text: { group: "inline" },
	},
	marks: {
		comment: { attrs: { id: { default: null } } },
		strong: {},
		em: {},
		suggestion: { attrs: { text: { default: null } } },
	},
});

const { comment, strong, em, suggestion } = schema.marks;

const namesOf = (marks: ReturnType<typeof buildReplacement>) =>
	marks.map((m) => m.map((mark) => mark.type.name).sort());

describe("buildReplacement", () => {
	it("keeps formatting and comment of the surviving word", () => {
		const marked = [strong.create(), comment.create({ id: "c1" }), suggestion.create({ text: "Вода" })];
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [
				schema.text("Вода", marked),
				schema.text(" вода", [suggestion.create({ text: "Вода" })]),
			]),
		]);

		const result = buildReplacement(doc, 1, 10, "Вода", suggestion);

		expect(result).toHaveLength(4);
		expect(namesOf(result)).toEqual([
			["comment", "strong"],
			["comment", "strong"],
			["comment", "strong"],
			["comment", "strong"],
		]);
	});

	it("keeps bold and italic of the first word when the repeat is dropped", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [
				schema.text("мокрое", [strong.create(), em.create()]),
				schema.text(" мокрое", [em.create()]),
			]),
		]);

		const result = buildReplacement(doc, 1, 14, "мокрое", suggestion);

		expect(namesOf(result)).toEqual(Array.from("мокрое", () => ["em", "strong"]));
	});

	it("keeps the tail of the fragment when the fix rewrites its middle", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [schema.text("демо-версия", [comment.create({ id: "c1" })])]),
		]);

		const result = buildReplacement(doc, 1, 12, "демоверсия", suggestion);

		expect(result).toHaveLength("демоверсия".length);
		expect(namesOf(result).every((names) => names.includes("comment"))).toBe(true);
	});

	it("gives inserted text the marks it grows from", () => {
		const doc = schema.node("doc", null, [
			schema.node("paragraph", null, [schema.text("кот", [strong.create()]), schema.text("ик")]),
		]);

		const result = buildReplacement(doc, 1, 6, "котёнок", suggestion);

		expect(namesOf(result)).toEqual([["strong"], ["strong"], ["strong"], ["strong"], ["strong"], ["strong"], []]);
	});
});
