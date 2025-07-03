import DocCreator from "@ext/markdown/elements/diff/logic/test/utils/DocCreator";

describe("DocCreator", () => {
	it("should create a doc", () => {
		const doc = DocCreator.create().p("Hello").value();
		expect(doc).toEqual([{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }]);
	});

	it("should create an empty paragraph", () => {
		const doc = DocCreator.create().p("").value();
		expect(doc).toEqual([{ type: "paragraph" }]);
	});

	it("should create an empty heading", () => {
		const doc = DocCreator.create().h(1, "").value();
		expect(doc).toEqual([{ type: "heading", attrs: { id: null, level: 1, isCustomId: false } }]);
	});

	it("should create a doc with list", () => {
		const doc = DocCreator.create()
			.p("Hello")
			.bulletList(
				DocCreator.listItem(DocCreator.p("List item 1")),
				DocCreator.listItem(DocCreator.p("List item 2")),
			)
			.value();
		expect(doc).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Hello" }] },
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "List item 1" }] }],
					},
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "List item 2" }] }],
					},
				],
			},
		]);
	});
	it("replace element by path", () => {
		const doc = DocCreator.create()
			.p("Hello")
			.bulletList(
				DocCreator.listItem(DocCreator.p("List item 1")),
				DocCreator.listItem(DocCreator.p("List item 2")),
			)
			.p("World")
			.replace([1, 0, 0], DocCreator.p("Replaced item"))
			.value();

		expect(doc).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "Hello" }] },
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "Replaced item" }] }],
					},
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "List item 2" }] }],
					},
				],
			},
			{ type: "paragraph", content: [{ type: "text", text: "World" }] },
		]);
	});
	it("should create a doc with nested list", () => {
		const doc = DocCreator.create()
			.bulletList(
				DocCreator.listItem(DocCreator.p("123")),
				DocCreator.listItem(DocCreator.p("5678"), DocCreator.p("000")),
			)
			.value();

		expect(doc).toEqual([
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "123" }] }],
					},
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [
							{ type: "paragraph", content: [{ type: "text", text: "5678" }] },
							{ type: "paragraph", content: [{ type: "text", text: "000" }] },
						],
					},
				],
			},
		]);
	});
	it("should create a doc with marks", () => {
		const doc = DocCreator.create().p("Hello ", { type: "strong", text: "bold text" }, " and normal text").value();
		expect(doc).toEqual([
			{
				type: "paragraph",
				content: [
					{ type: "text", text: "Hello " },
					{ type: "text", marks: [{ type: "strong" }], text: "bold text" },
					{ type: "text", text: " and normal text" },
				],
			},
		]);
	});

	it("should insert element at path", () => {
		const doc = DocCreator.create().p("First").p("Last").insertAfter([0], DocCreator.p("Inserted")).value();

		expect(doc).toEqual([
			{ type: "paragraph", content: [{ type: "text", text: "First" }] },
			{ type: "paragraph", content: [{ type: "text", text: "Inserted" }] },
			{ type: "paragraph", content: [{ type: "text", text: "Last" }] },
		]);
	});

	it("should insert element in nested structure", () => {
		const doc = DocCreator.create()
			.bulletList(DocCreator.listItem(DocCreator.p("First")), DocCreator.listItem(DocCreator.p("Last")))
			.insertAfter([0, 0], DocCreator.listItem(DocCreator.p("Inserted")))
			.value();

		expect(doc).toEqual([
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }],
					},
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "Inserted" }] }],
					},
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "Last" }] }],
					},
				],
			},
		]);
	});

	it("should create list item with multiple paragraphs", () => {
		const doc = DocCreator.create()
			.bulletList(DocCreator.listItem(DocCreator.p("First"), DocCreator.p("Second")))
			.value();

		expect(doc).toEqual([
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [
							{ type: "paragraph", content: [{ type: "text", text: "First" }] },
							{ type: "paragraph", content: [{ type: "text", text: "Second" }] },
						],
					},
				],
			},
		]);
	});

	it("should remove element at path", () => {
		const doc = DocCreator.create().p("First").p("Second").remove([1]).value();
		expect(doc).toEqual([{ type: "paragraph", content: [{ type: "text", text: "First" }] }]);
	});

	it("should remove element in nested structure", () => {
		const doc = DocCreator.create()
			.bulletList(DocCreator.listItem(DocCreator.p("First")), DocCreator.listItem(DocCreator.p("Second")))
			.remove([0, 0])
			.value();

		expect(doc).toEqual([
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						attrs: { isTaskItem: null },
						content: [{ type: "paragraph", content: [{ type: "text", text: "Second" }] }],
					},
				],
			},
		]);
	});

	it("should create a heading with level", () => {
		const doc = DocCreator.create().h(2, "Hello World").value();
		expect(doc).toEqual([
			{
				type: "heading",
				attrs: {
					id: null,
					level: 2,
					isCustomId: false,
				},
				content: [{ type: "text", text: "Hello World" }],
			},
		]);
	});

	it("should create a heading with marks", () => {
		const doc = DocCreator.create().h(1, "Hello ", { type: "strong", text: "bold text" }).value();
		expect(doc).toEqual([
			{
				type: "heading",
				attrs: {
					id: null,
					level: 1,
					isCustomId: false,
				},
				content: [
					{ type: "text", text: "Hello " },
					{ type: "text", marks: [{ type: "strong" }], text: "bold text" },
				],
			},
		]);
	});
});
