import ProsemirrorAstDiffTransformer from "@ext/markdown/elements/diff/logic/astTransformer/ProseMirrorAstDiffTransformer";
import getDiffDecoratorsAndDiffLines from "@ext/markdown/elements/diff/logic/getDiffDecoratorsAndDiffLines";
import { DiffLine } from "@ext/markdown/elements/diff/logic/model/DiffLine";
import createDiffDocs from "@ext/markdown/elements/diff/logic/test/utils/createDiffDocs";
import DocCreator from "@ext/markdown/elements/diff/logic/test/utils/DocCreator";
import { Node } from "prosemirror-model";
import { Decoration } from "prosemirror-view";

const getDiffData = (oldDoc: Node, newDoc: Node) => {
	const astDiffTransformer = new ProsemirrorAstDiffTransformer(oldDoc, newDoc);
	return getDiffDecoratorsAndDiffLines(astDiffTransformer, { canStringsBeCompared: () => true });
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

describe("getDiffDecoratorsAndDiffLines returns", () => {
	it("inline decorators in changed text", () => {
		const { oldDoc, newDoc } = createDiffDocs(
			(doc) => doc.p("Paragraph 1").p("Paragraph 2"),
			(doc) => doc.replace([1], DocCreator.p("Paragraph 22")),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(1);
		expect(getDecoratorText(newDoc, addedDecorations[0])).toBe("2");

		expect(removedDecorations).toHaveLength(0);

		expect(diffLines).toHaveLength(1);
		expect(diffLines[0].type).toBe("modified");
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("Paragraph 22");
	});

	it("diff line in new paragraph", () => {
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

	it("one added diffline in new paragraph with marks", () => {
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
					.p("Fourth paragraph"),
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
					.insertAfter([1], DocCreator.p("New paragraph")),
		);

		const { diffLines, addedDecorations, removedDecorations } = getDiffData(oldDoc, newDoc);

		expect(addedDecorations).toHaveLength(2);
		expect(removedDecorations).toHaveLength(1);

		expect(getDecoratorText(newDoc, addedDecorations[0])).toBe("italic");
		expect(getDecoratorText(newDoc, addedDecorations[1])).toBe(" modified");

		expect(removedDecorations).toHaveLength(1);
		expect(getDecoratorText(oldDoc, removedDecorations[0])).toBe("bold");

		expect(diffLines).toHaveLength(3);
		expect(diffLines.map((line) => line.type).sort()).toEqual(["added", "modified", "modified"].sort());
		expect(getDiffLineContent(newDoc, diffLines[0])).toBe("New paragraph");
		expect(getDiffLineContent(newDoc, diffLines[1])).toBe("Second paragraph with italic text");
		expect(getDiffLineContent(newDoc, diffLines[2])).toBe("First paragraph modified");
	});
});
