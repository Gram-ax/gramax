import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";

describe("AttributeFormatter", () => {
	const formatter = new AttributeFormatter();

	describe("parse", () => {
		test("defs", () => {
			expect(formatter.parse({ defs: "a=1,b,c=3" })).toEqual({
				defs: [
					{ id: "a", value: ["1"] },
					{ id: "b", value: undefined },
					{ id: "c", value: ["3"] },
				],
			});
		});

		test("defs with multiple values joined by &", () => {
			expect(formatter.parse({ defs: "status=active&done" })).toEqual({
				defs: [{ id: "status", value: ["active", "done"] }],
			});
		});

		test("orderby", () => {
			expect(formatter.parse({ orderby: "a,b,c" })).toEqual({
				orderby: [
					{ id: "a", value: undefined },
					{ id: "b", value: undefined },
					{ id: "c", value: undefined },
				],
			});
		});

		test("groupby", () => {
			expect(formatter.parse({ groupby: "a,b,c" })).toEqual({
				groupby: ["a", "b", "c"],
			});
		});

		test("select", () => {
			expect(formatter.parse({ select: "a,b,c" })).toEqual({
				select: ["a", "b", "c"],
			});
		});

		test("все атрибуты вместе", () => {
			expect(
				formatter.parse({
					orderby: "date,name",
					groupby: "category,author",
					defs: "status=active,priority=high,tags",
					select: "title,content",
				}),
			).toEqual({
				orderby: [
					{ id: "date", value: undefined },
					{ id: "name", value: undefined },
				],
				groupby: ["category", "author"],
				defs: [
					{ id: "status", value: ["active"] },
					{ id: "priority", value: ["high"] },
					{ id: "tags", value: undefined },
				],
				select: ["title", "content"],
			});
		});

		test("ignores unknown attributes", () => {
			expect(formatter.parse({ unknown: "value", defs: "a=1" })).toEqual({
				defs: [{ id: "a", value: ["1"] }],
			});
		});

		test("skips empty values", () => {
			expect(formatter.parse({ defs: "" })).toEqual({});
		});
	});

	describe("stringify", () => {
		test("defs with id field", () => {
			expect(
				formatter.stringify({
					defs: [
						{ id: "a", value: ["1"] },
						{ id: "b", value: undefined },
						{ id: "c", value: ["3"] },
					],
				}),
			).toEqual({ defs: "a=1,b,c=3" });
		});

		test("defs with legacy name field", () => {
			expect(
				formatter.stringify({
					defs: [
						{ name: "a", value: ["1"] },
						{ name: "b", value: undefined },
					],
				}),
			).toEqual({ defs: "a=1,b" });
		});

		test("defs with mixed id and name fields", () => {
			expect(
				formatter.stringify({
					defs: [
						{ id: "x", value: ["1"] },
						{ name: "y", value: ["2"] },
					],
				}),
			).toEqual({ defs: "x=1,y=2" });
		});

		test("id takes precedence over name", () => {
			expect(
				formatter.stringify({
					defs: [{ id: "correct", name: "legacy", value: ["v"] }],
				}),
			).toEqual({ defs: "correct=v" });
		});

		test("defs with multiple values joined by &", () => {
			expect(
				formatter.stringify({
					defs: [{ id: "status", value: ["active", "done"] }],
				}),
			).toEqual({ defs: "status=active&done" });
		});

		test("orderby", () => {
			expect(
				formatter.stringify({
					orderby: [
						{ id: "a", value: undefined },
						{ id: "b", value: undefined },
						{ id: "c", value: undefined },
					],
				}),
			).toEqual({ orderby: "a,b,c" });
		});

		test("groupby", () => {
			expect(
				formatter.stringify({
					groupby: ["a", "b", "c"],
				}),
			).toEqual({ groupby: "a,b,c" });
		});

		test("select", () => {
			expect(
				formatter.stringify({
					select: ["a", "b", "c"],
				}),
			).toEqual({ select: "a,b,c" });
		});

		test("все атрибуты вместе", () => {
			expect(
				formatter.stringify({
					orderby: [
						{ id: "date", value: undefined },
						{ id: "name", value: undefined },
					],
					groupby: ["category", "author"],
					defs: [
						{ id: "status", value: ["active"] },
						{ id: "priority", value: ["high"] },
						{ id: "tags", value: undefined },
					],
					select: ["title", "content"],
				}),
			).toEqual({
				orderby: "date,name",
				groupby: "category,author",
				defs: "status=active,priority=high,tags",
				select: "title,content",
			});
		});

		test("orderby with empty values omits trailing equals", () => {
			expect(
				formatter.stringify({
					orderby: [{ id: "status", value: [] }],
				}),
			).toEqual({ orderby: "status" });
		});
	});

	describe("parse → stringify roundtrip", () => {
		test("roundtrip preserves data", () => {
			const input = "status=active&done,priority=high,tags";
			const parsed = formatter.parse({ defs: input });
			const stringified = formatter.stringify(parsed);
			expect(stringified).toEqual({ defs: input });
		});
	});
});
