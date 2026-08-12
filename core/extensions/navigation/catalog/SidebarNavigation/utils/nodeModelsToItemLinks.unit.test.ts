import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { nodeModelsToItemLinks } from "./nodeModelsToItemLinks";

const link = (path: string, items?: ItemLink[]): ItemLink =>
	({ ref: { path }, title: path, items }) as unknown as ItemLink;

const node = (data: ItemLink, parent: string | number): NodeModel<ItemLink> => ({
	id: data.ref.path,
	parent,
	text: data.title,
	data,
});

test("rebuilds the optimistic tree from node parents instead of stale nested items", () => {
	const moved = link("source/article");
	const source = link("source", [moved]);
	const target = link("target", []);
	const nodes = [node(source, 0), node(target, 0), node(moved, "target")];

	const result = nodeModelsToItemLinks(nodes, 0);

	expect(result.map((item) => item.ref.path)).toEqual(["source", "target"]);
	expect((result[0] as CategoryLink).items).toEqual([]);
	expect((result[1] as CategoryLink).items?.map((item) => item.ref.path)).toEqual(["source/article"]);
});
