import type { Node } from "@tiptap/pm/model";

export const getMarkStartPos = (doc: Node, markName: string, from: number) => {
	let pos = from;

	const CurrentPos = doc.resolve(pos);
	const hasLink = CurrentPos.marks().some((mark) => mark.type.name === markName);

	if (!hasLink) return pos;

	while (pos > 0) {
		const PrevPos = doc.resolve(pos - 1);
		const prevHasLink = PrevPos.marks().some((mark) => mark.type.name === markName);

		if (!prevHasLink) break;

		pos--;
	}

	return pos;
};
