import type { Node } from "@tiptap/pm/model";

export const getMarkEndPos = (doc: Node, markName: string, to: number) => {
	let pos = to;

	const CurrentPos = doc.resolve(pos);
	const hasLink = CurrentPos.marks().some((mark) => mark.type.name === markName);

	if (!hasLink) return pos;

	while (pos < doc.content.size) {
		const NextPos = doc.resolve(pos + 1);
		const nextHasLink = NextPos.marks().some((mark) => mark.type.name === markName);

		if (!nextHasLink) break;

		pos++;
	}

	return pos;
};
