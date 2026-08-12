import type { MarkType, Node, Mark as PMMark } from "@tiptap/pm/model";

const getMarkedChars = (doc: Node, from: number, to: number, exclude: MarkType) => {
	const chars: { char: string; marks: PMMark[] }[] = [];

	doc.nodesBetween(from, to, (node, pos) => {
		if (!node.isText) return;
		const marks = node.marks.filter((mark) => mark.type !== exclude);
		const text = node.text.slice(Math.max(from - pos, 0), Math.min(to - pos, node.nodeSize));
		for (const char of text) chars.push({ char, marks });
	});

	return chars;
};

const buildReplacement = (doc: Node, from: number, to: number, replaceText: string, exclude: MarkType): PMMark[][] => {
	const chars = getMarkedChars(doc, from, to, exclude);
	const original = chars.map((char) => char.char).join("");

	let prefix = 0;
	while (prefix < original.length && prefix < replaceText.length && original[prefix] === replaceText[prefix])
		prefix++;

	let suffix = 0;
	while (
		suffix < original.length - prefix &&
		suffix < replaceText.length - prefix &&
		original[original.length - 1 - suffix] === replaceText[replaceText.length - 1 - suffix]
	)
		suffix++;

	const insertedMarks = chars[prefix - 1]?.marks ?? chars[prefix]?.marks ?? [];

	return [
		...chars.slice(0, prefix).map((char) => char.marks),
		...Array.from(replaceText.slice(prefix, replaceText.length - suffix), () => insertedMarks),
		...chars.slice(chars.length - suffix).map((char) => char.marks),
	];
};

export default buildReplacement;
