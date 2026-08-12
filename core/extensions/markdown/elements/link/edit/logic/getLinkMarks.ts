import type { Mark, Node } from "@tiptap/pm/model";

export interface AdjacentLinkMarks {
	current?: Mark;
	before?: Mark;
	after?: Mark;
}

const findLink = (markName: string, marks?: readonly Mark[]) => marks?.find((mark) => mark.type.name === markName);

/**
 * Finds the link mark on the characters immediately adjacent to `pos` by reading
 * the neighbouring nodes' marks directly.
 *
 * `ResolvedPos.marks()` factors in mark inclusiveness and drops non-inclusive
 * marks (the link mark is non-inclusive) at text-node boundaries. A single-letter
 * word has no interior position, so every cursor spot around it is a boundary and
 * the link becomes invisible to `marks()` — the link menu never opens (issue #289).
 * Reading `nodeBefore`/`nodeAfter` marks is boundary-agnostic and fixes that while
 * keeping the multi-letter behaviour unchanged.
 */
export const getLinkMarks = (doc: Node, pos: number, markName = "link"): AdjacentLinkMarks => {
	const currentPos = doc.resolve(pos);

	const after = findLink(markName, currentPos.nodeAfter?.marks);
	const before = findLink(markName, currentPos.nodeBefore?.marks);
	const current = after ?? before;

	return { current, before, after };
};
