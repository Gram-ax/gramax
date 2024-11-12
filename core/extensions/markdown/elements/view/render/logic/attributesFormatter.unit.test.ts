import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";

describe("AttributeFormatter", () => {
	const formatter = new AttributeFormatter();

	describe("parse", () => {
		test("defs", () => {
			expect(formatter.parse({ defs: "a=1,b,c=3" })).toEqual({
				defs: [
					{ name: "a", value: ["1"] },
					{ name: "b", value: undefined },
					{ name: "c", value: ["3"] },
				],
			});
		});

		test("orderby", () => {
			expect(formatter.parse({ orderby: "a,b,c" })).toEqual({
				orderby: ["a", "b", "c"],
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
				orderby: ["date", "name"],
				groupby: ["category", "author"],
				defs: [
					{ name: "status", value: ["active"] },
					{ name: "priority", value: ["high"] },
					{ name: "tags", value: undefined },
				],
				select: ["title", "content"],
			});
		});
	});

	describe("stringify", () => {
		test("defs", () => {
			expect(
				formatter.stringify({
					defs: [
						{ name: "a", value: ["1"] },
						{ name: "b", value: undefined },
						{ name: "c", value: ["3"] },
					],
				}),
			).toEqual({ defs: "a=1,b,c=3", orderby: "", groupby: "", select: "" });
		});

		test("orderby", () => {
			expect(
				formatter.stringify({
					orderby: ["a", "b", "c"],
				}),
			).toEqual({ defs: "", orderby: "a,b,c", groupby: "", select: "" });
		});

		test("groupby", () => {
			expect(
				formatter.stringify({
					groupby: ["a", "b", "c"],
				}),
			).toEqual({ defs: "", orderby: "", groupby: "a,b,c", select: "" });
		});

		test("select", () => {
			expect(
				formatter.stringify({
					select: ["a", "b", "c"],
				}),
			).toEqual({ defs: "", orderby: "", groupby: "", select: "a,b,c" });
		});

		test("все атрибуты вместе", () => {
			expect(
				formatter.stringify({
					orderby: ["date", "name"],
					groupby: ["category", "author"],
					defs: [
						{ name: "status", value: ["active"] },
						{ name: "priority", value: ["high"] },
						{ name: "tags", value: undefined },
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
	});
});
