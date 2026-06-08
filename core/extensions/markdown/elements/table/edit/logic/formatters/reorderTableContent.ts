import type { Node } from "@tiptap/pm/model";

const reorderTableContent = (tableNode: Node): Node => {
	const rows: Node[] = [];

	for (let i = 0; i < tableNode.childCount; i++) {
		const row = tableNode.child(i);
		const initialOrder = (row.attrs.initialOrder as number | undefined) ?? tableNode.childCount + i;
		const newRow = row.type.create({ ...row.attrs, initialOrder }, row.content);
		rows.push(newRow);
	}

	rows.sort((a, b) => {
		const oa = a.attrs.initialOrder as number;
		const ob = b.attrs.initialOrder as number;
		return oa - ob;
	});

	return tableNode.type.create(tableNode.attrs, rows);
};

export default reorderTableContent;
