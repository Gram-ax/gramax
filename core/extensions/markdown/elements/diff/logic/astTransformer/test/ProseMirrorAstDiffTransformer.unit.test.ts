import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import ProsemirrorAstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/ProseMirrorAstDiffTransformer";
import D from "@ext/markdown/elements/diff/logic/test/utils/DocCreator";
import { Node } from "prosemirror-model";

const schema = getSchema();

const getTransformer = (content: any[]) => {
	const newNode = Node.fromJSON(schema, { type: "doc", content });
	const emptyOldNode = Node.fromJSON(schema, { type: "doc", content: [] });
	const transformer = new ProsemirrorAstDiffTransformer(emptyOldNode, newNode);
	return { transformer, node: newNode };
};

const getContentFromAstPos = (ast: Node, from: number, to: number) => {
	to++;
	return ast.slice(from, to).content.textBetween(0, to - from);
};

describe("ProseMirrorAstDiffTransformer", () => {
	describe("returns array of strings in ast", () => {
		it("simple", () => {
			const newAst = D.create().p("Hello").p("World").value();
			const { transformer } = getTransformer(newAst);

			const strings = transformer.getStrings().newStrings;
			expect(strings).toEqual(["Hello", "World"]);
		});

		it("nested", () => {
			const ast = D.create()
				.p("Hello")
				.bulletList(D.listItem(D.p("List item level 1")), D.bulletList(D.listItem(D.p("List item level 2"))))
				.p("World")
				.value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["Hello", "List item level 1", "List item level 2", "World"]);
		});

		it("with marks", () => {
			const ast = D.create().p("Hello").p("W", { type: "strong", text: "orl" }, "d").value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["Hello", "World"]);
		});

		it("with headings", () => {
			const ast = D.create().h(1, "Main Title").p("Hello").h(2, "Subtitle").p("World").value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["Main Title", "Hello", "Subtitle", "World"]);
		});

		it("with headings and marks", () => {
			const ast = D.create()
				.h(1, "Main ", { type: "strong", text: "Title" })
				.p("Hello")
				.h(2, "Sub", { type: "em", text: "title" })
				.p("World")
				.value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["Main Title", "Hello", "Subtitle", "World"]);
		});

		it("with empty paragraphs", () => {
			const ast = D.create().p("").p("Hello").p("").p("World").p("").value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["", "Hello", "", "World", ""]);
		});

		it("with empty headings", () => {
			const ast = D.create().h(1, "").p("Hello").h(2, "").p("World").value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["", "Hello", "", "World"]);
		});

		it("with empty list items", () => {
			const ast = D.create()
				.p("Hello")
				.bulletList(D.listItem(D.p("")), D.bulletList(D.listItem(D.p(""))))
				.p("World")
				.value();
			const { transformer } = getTransformer(ast);

			const strings = transformer.getStrings().newStrings;

			expect(strings).toEqual(["Hello", "", "", "World"]);
		});
	});

	describe("returns ast pos from string index", () => {
		it("simple", () => {
			const ast = D.create().p("Hello").p("World").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 1, 2);
			const astPos2 = transformer.getAstPos("new", 1, 4);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("rld");
		});

		it("with marks", () => {
			const ast = D.create().p("Hello").p("Wo", { type: "strong", text: "rl" }, "d").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 1, 2);
			const astPos2 = transformer.getAstPos("new", 1, 4);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("rld");
		});

		it("nested", () => {
			const ast = D.create()
				.p("Hello")
				.bulletList(D.listItem(D.p("List item level 1")), D.bulletList(D.listItem(D.p("List item level 2"))))
				.p("World")
				.value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 2, 0);
			const astPos2 = transformer.getAstPos("new", 2, 2);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("Lis");
		});

		it("with headings", () => {
			const ast = D.create().h(1, "Main Title").p("Hello").h(2, "Subtitle").p("World").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 0, 0);
			const astPos2 = transformer.getAstPos("new", 0, 3);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("Main");
		});

		it("with headings and marks", () => {
			const ast = D.create().h(1, "Main ", { type: "strong", text: "Title" }).p("Hello").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 0, 2);
			const astPos2 = transformer.getAstPos("new", 0, 6);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("in Ti");
		});

		it("with empty paragraphs", () => {
			const ast = D.create().p("").p("Hello").p("").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 0, 0);
			const astPos2 = transformer.getAstPos("new", 0, 0);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("");
		});

		it("with empty headings", () => {
			const ast = D.create().h(1, "").p("Hello").value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 0, 0);
			const astPos2 = transformer.getAstPos("new", 0, 0);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("");
		});

		it("with empty list items", () => {
			const ast = D.create()
				.bulletList(D.listItem(D.p("")))
				.p("Hello")
				.value();
			const { transformer, node } = getTransformer(ast);
			transformer.getStrings();

			const astPos1 = transformer.getAstPos("new", 0, 0);
			const astPos2 = transformer.getAstPos("new", 0, 0);

			expect(getContentFromAstPos(node, astPos1, astPos2)).toEqual("");
		});
	});
});
