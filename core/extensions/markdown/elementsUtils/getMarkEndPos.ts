import { Node } from "@tiptap/pm/model";

export const getMarkEndPos = (doc: Node, markName: string, to: number) => {
	let pos = to;

	const $currentPos = doc.resolve(pos);
	const hasLink = $currentPos.marks().some((mark) => mark.type.name === markName);

	if (!hasLink) return pos;

	while (pos < doc.content.size) {
		const $nextPos = doc.resolve(pos + 1);
		const nextHasLink = $nextPos.marks().some((mark) => mark.type.name === markName);

		if (!nextHasLink) break;

		pos++;
	}

	return pos;
};
