import ProsemirrorAstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/ProseMirrorAstDiffTransformer";
import DiffRenderDataHandler from "@ext/markdown/elements/diff/logic/DiffRenderDataHandler";
import { DiffLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import createDiffDocs from "@ext/markdown/elements/diff/logic/test/utils/createDiffDocs";
import DocCreator from "@ext/markdown/elements/diff/logic/test/utils/DocCreator";
import { Node } from "prosemirror-model";
import { Decoration } from "prosemirror-view";

const getDiffData = (oldDoc: Node, newDoc: Node) => {
	const astDiffTransformer = new ProsemirrorAstDiffTransformer(oldDoc, newDoc);
	return new DiffRenderDataHandler(astDiffTransformer, {
		canStringsBeCompared: (oldString, newString) => oldString.length > 1 && newString.length > 1,
	}).getDiffRenderData();
};

const getDecoratorText = (doc: Node, decoration: Decoration) => {
	return doc.slice(decoration.from, decoration.to).content.lastChild?.textContent;
};

const getDiffLineContent = (doc: Node, diffLine: DiffLine) => {
	let content = "";
	doc.slice(diffLine.pos.from, diffLine.pos.to + 1).content.forEach((node) => {
		content += node.textContent;
	});
	return content;
};

describe("DiffRenderDataHandler", () => {
	it("should return inline decorators in changed text", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("Paragraph 1").p("Paragraph 2"),
			(doc) => doc.replace([1], DocCreator.p("Paragraph 22")),
		);

		const { diffLines, addedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(1);
		expect(getDecoratorText(newDoc, addedDecorations[0])).toBeDefined();

		expect(diffLines).toHaveLength(1);
		expect(diffLines[0].type).toBe("modified");
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("Paragraph 22");
	});

	it("should return diff line in new paragraph", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("Paragraph 1").p("Paragraph 2"),
			(doc) => doc.insertAfter([0], DocCreator.p("new content")),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(0);
		expect(removedDecorations).toHaveLength(0);

		expect(diffLines).toHaveLength(1);
		expect(diffLines[0].type).toBe("added");
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("new content");
	});

	it("should return one added diffline in new paragraph with marks", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("Article title").p("Paragraph 1").p("Paragraph 2").p("Paragraph 3"),
			(doc) => doc.p("new content ", { type: "strong", text: "with strong text" }),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(0);
		expect(removedDecorations).toHaveLength(0);

		expect(diffLines).toHaveLength(1);
		expect(diffLines[0].type).toBe("added");
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("new content with strong text");
	});

	it("should handle multiple paragraphs changes", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("First paragraph").p("Second paragraph").p("Third paragraph"),
			(doc) =>
				doc
					.replace([0], DocCreator.p("First paragraph modified"))
					.replace([1], DocCreator.p("Second paragraph modified"))
					.p("New added fourth paragraph at the end"),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(2);
		expect(removedDecorations).toHaveLength(0);

		expect(diffLines).toHaveLength(3);
		expect(diffLines.map((line) => line.type).sort()).toEqual(["added", "modified", "modified"].sort());
	});

	it("should handle complete paragraph removal", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("First paragraph").p("Second paragraph").p("Third paragraph"),
			(doc) => doc.remove([1]),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(0);
		expect(removedDecorations).toHaveLength(0);

		expect(diffLines).toHaveLength(1);
		expect(diffLines[0].type).toBe("deleted");
		expect(getDiffLineContent(oldDoc, diffLines[0])).toBe("Second paragraph");
	});

	it("should handle mixed content changes", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) =>
				doc
					.p("First paragraph")
					.p("Second paragraph with ", { type: "strong", text: "bold" }, " text")
					.p("Third paragraph"),
			(doc) =>
				doc
					.replace([0], DocCreator.p("First paragraph modified"))
					.replace([1], DocCreator.p("Second paragraph with ", { type: "em", text: "italic" }, " text"))
					.insertAfter([1], DocCreator.p("New paragraph at the end")),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(2);
		expect(removedDecorations).toHaveLength(1);

		expect(getDecoratorText(newDoc, addedDecorations[0])).toBe("italic");
		expect(getDecoratorText(newDoc, addedDecorations[1])).toBe(" modified");

		expect(getDecoratorText(oldDoc, removedDecorations[0])).toBe("bold");

		expect(diffLines).toHaveLength(3);
		expect(diffLines.map((line) => line.type).sort()).toEqual(["added", "modified", "modified"].sort());
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("New paragraph at the end");
		expect(getDiffLineContent(newDoc, diffLines[1])).toBe("Second paragraph with italic text");
		expect(getDiffLineContent(newDoc, diffLines[2])).toBe("First paragraph modified");
	});

	describe("should handle empty paragraphs", () => {
		test("added", () => {
			const { oldDoc, newDoc } = createDiffDocs(
				(doc) => doc.p("First paragraph").p("Second paragraph").p("Third paragraph"),
				(doc) => doc.insertAfter([0], DocCreator.p("")),
			);

			const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

			expect(addedDecorations).toHaveLength(0);
			expect(removedDecorations).toHaveLength(0);

			expect(diffLines).toHaveLength(1);
			expect(diffLines[0].type).toBe("added");
			expect(getDiffLineContent(newDoc, diffLines[0])).toBe("");
		});

		test("deleted", () => {
			const { oldDoc, newDoc } = createDiffDocs(
				(doc) => doc.p("First paragraph").p("").p("Second paragraph").p("Third paragraph"),
				(doc) => doc.remove([1]),
			);

			const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

			expect(addedDecorations).toHaveLength(0);
			expect(removedDecorations).toHaveLength(0);

			expect(diffLines).toHaveLength(1);
			expect(diffLines[0].type).toBe("deleted");
			expect(getDiffLineContent(oldDoc, diffLines[0])).toBe("");
		});

		test("moved", () => {
			const { oldDoc, newDoc } = createDiffDocs(
				(doc) => doc.p("First paragraph").p("").p("Second paragraph").p("Third paragraph"),
				(doc) => doc.remove([1]).insertAfter([2], DocCreator.p("")),
			);

			const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

			expect(addedDecorations).toHaveLength(0);
			expect(removedDecorations).toHaveLength(0);

			expect(diffLines).toHaveLength(2);
			expect(diffLines[0].type).toBe("added");
			expect(getDiffLineContent(newDoc, diffLines[0])).toBe("");
			expect(diffLines[1].type).toBe("deleted");
			expect(getDiffLineContent(oldDoc, diffLines[1])).toBe("");
		});
	});

	describe("should be fast", () => {
		const paragraph =
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

		const createLargeDoc = (doc: DocCreator, content: string, iterations: number) => {
			for (let i = 0; i < iterations; i++) {
				doc.p(content + " " + i);
			}
			return doc;
		};

		describe("with 100 paragraphs", () => {
			const iterations = 100;

			test("modified", () => {
				const { oldDoc, newDoc } = createDiffDocs(
					(doc) => createLargeDoc(doc, paragraph, iterations),
					(doc) => {
						for (let i = iterations - 1; i >= 0; i--) {
							doc.remove([i]);
						}
						return createLargeDoc(doc, paragraph + " modified", iterations);
					},
				);

				const startTime = performance.now();
				const { diffLines } = getDiffData(oldDoc, newDoc);
				const endTime = performance.now();

				const executionTime = endTime - startTime;

				expect(diffLines.length).toBe(iterations);
				expect(executionTime).toBeLessThan(1000);
			});

			test("added and deleted", () => {
				const { oldDoc, newDoc } = createDiffDocs(
					(doc) => createLargeDoc(doc, paragraph, iterations),
					(doc) => {
						for (let i = iterations - 1; i >= 0; i--) {
							doc.remove([i]);
						}
						return createLargeDoc(doc, "absolute new content", iterations);
					},
				);

				const startTime = performance.now();
				const { diffLines } = getDiffData(oldDoc, newDoc);
				const endTime = performance.now();

				const executionTime = endTime - startTime;

				expect(diffLines.length).toBe(iterations * 2);
				expect(executionTime).toBeLessThan(1000);
			});
		});

		describe("with 1000 paragraphs and 100", () => {
			test("modified", () => {
				const iterations = 1000;
				const replacements = 100;
				const { oldDoc, newDoc } = createDiffDocs(
					(doc) => createLargeDoc(doc, paragraph, iterations),
					(doc) => {
						for (let i = replacements - 1; i >= 0; i--) {
							doc.remove([i]);
						}
						return createLargeDoc(doc, paragraph + " modified", replacements);
					},
				);

				const startTime = performance.now();
				const { diffLines } = getDiffData(oldDoc, newDoc);
				const endTime = performance.now();

				const executionTime = endTime - startTime;

				expect(diffLines.length).toBe(replacements);
				expect(executionTime).toBeLessThan(1000);
			});

			test("added and deleted", () => {
				const iterations = 1000;
				const replacements = 100;
				const { oldDoc, newDoc } = createDiffDocs(
					(doc) => createLargeDoc(doc, paragraph, iterations),
					(doc) => {
						for (let i = replacements - 1; i >= 0; i--) {
							doc.remove([i]);
						}
						return createLargeDoc(doc, "absolute new content", replacements);
					},
				);

				const startTime = performance.now();
				const { diffLines } = getDiffData(oldDoc, newDoc);
				const endTime = performance.now();

				const executionTime = endTime - startTime;

				expect(diffLines.length).toBe(replacements * 2);
				expect(executionTime).toBeLessThan(1000);
			});
		});
	});
});
