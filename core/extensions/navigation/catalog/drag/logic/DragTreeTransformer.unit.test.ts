import type { ItemLink } from "@ext/navigation/NavigationLinks";
import DragTreeTransformer from "./DragTreeTransformer";

const link = (path: string, title: string, items?: ItemLink[]): ItemLink =>
	({ ref: { path }, title, items }) as unknown as ItemLink;

describe("DragTreeTransformer", () => {
	test("uses stable paths as node ids and parent ids", () => {
		const items = [link("group", "Group", [link("group/article", "Article")])];

		const result = DragTreeTransformer.getRenderDragNav(items);

		expect(result.map(({ id, parent }) => ({ id, parent }))).toEqual([
			{ id: "group", parent: DragTreeTransformer.getRootId() },
			{ id: "group/article", parent: "group" },
		]);
	});

	test("changing a title does not change the node id", () => {
		const before = DragTreeTransformer.getRenderDragNav([link("article", "Before")]);
		const after = DragTreeTransformer.getRenderDragNav([link("article", "After")]);

		expect(before[0].id).toBe(after[0].id);
	});
});
