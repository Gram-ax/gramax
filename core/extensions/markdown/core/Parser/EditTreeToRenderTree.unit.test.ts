import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror";
import editTreeToRenderTree from "@ext/markdown/core/Parser/EditTreeToRenderTree";
import testData from "./EditTreeToRenderTreeTestData.json";

test("EditTreeToRenderTree", () => {
	const schemes = getSchema();
	const renderTree = editTreeToRenderTree(testData.editTree, schemes);
	expect(renderTree).toEqual(testData.renderTree);
});
