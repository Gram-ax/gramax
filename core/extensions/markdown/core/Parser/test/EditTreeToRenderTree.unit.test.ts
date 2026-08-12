import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror";
import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import testData from "./EditTreeToRenderTreeTestData.json";

test("EditTreeToRenderTree", () => {
	const schemes = getSchema();
	const renderTree = editTreeToRenderTree(testData.editTree, schemes);
	expect(renderTree).toEqual(testData.renderTree);
});

test("assigns unique IDs to identical parsed headings", () => {
	const schemes = getSchema();
	const editTree = {
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { level: 2, id: null, isCustomId: false },
				content: [{ type: "text", text: "Section" }],
			},
			{
				type: "heading",
				attrs: { level: 2, id: null, isCustomId: false },
				content: [{ type: "text", text: "Section" }],
			},
		],
	};
	const renderTree = editTreeToRenderTree(editTree, schemes);

	expect(editTree.content.map((heading) => heading.attrs.id)).toEqual(["section", "section-1"]);
	if (typeof renderTree === "string") throw new Error("Expected an article render tree");
	expect(renderTree.children.map((heading) => (typeof heading === "string" ? null : heading.attributes.id))).toEqual([
		"section",
		"section-1",
	]);
});
