import { Node } from "@tiptap/pm/model";

export const getMarkStartPos = (doc: Node, markName: string, from: number) => {
	let pos = from;

	const $currentPos = doc.resolve(pos);
	const hasLink = $currentPos.marks().some((mark) => mark.type.name === markName);

	if (!hasLink) return pos;

	while (pos > 0) {
		const $prevPos = doc.resolve(pos - 1);
		const prevHasLink = $prevPos.marks().some((mark) => mark.type.name === markName);

		if (!prevHasLink) break;

		pos--;
	}

	return pos;
};
