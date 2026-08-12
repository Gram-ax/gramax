import type { SuggestionItem } from "@ext/StyleGuide/extension/Suggestion";
import parseSuggestionHtml, { type SuggestionSegmentAttrs } from "@ext/StyleGuide/logic/parseSuggestionHtml";
import type { MarkType, Node } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

const LEAF_PLACEHOLDER = "￼";
const IGNORED_CHAR = /[\s￼]/;

interface NormalizedText {
	text: string;
	map: { start: number; end: number }[];
}

interface Block {
	pos: number;
	normalized: NormalizedText;
	cursor: number;
}

interface MarkedRange {
	from: number;
	to: number;
	attrs: SuggestionSegmentAttrs;
}

const normalize = (raw: string): NormalizedText => {
	let text = "";
	const map: NormalizedText["map"] = [];
	let i = 0;

	while (i < raw.length) {
		if (raw[i] === LEAF_PLACEHOLDER) {
			i++;
			continue;
		}

		if (IGNORED_CHAR.test(raw[i])) {
			const start = i;
			while (i < raw.length && IGNORED_CHAR.test(raw[i])) i++;
			text += " ";
			map.push({ start, end: i });
			continue;
		}

		text += raw[i];
		map.push({ start: i, end: i + 1 });
		i++;
	}

	return { text, map };
};

const collectBlocks = (doc: Node): Block[] => {
	const blocks: Block[] = [];

	doc.descendants((node, pos) => {
		if (node.type.name !== "paragraph" && node.type.name !== "heading") return true;
		const raw = node.textBetween(0, node.content.size, "", LEAF_PLACEHOLDER);
		blocks.push({ pos, normalized: normalize(raw), cursor: 0 });
		return false;
	});

	return blocks;
};

const getSegmentRanges = (segments: ReturnType<typeof parseSuggestionHtml>) => {
	const ranges: { from: number; to: number; attrs: SuggestionSegmentAttrs }[] = [];
	let sentence = "";

	segments.forEach((segment) => {
		const normalized = normalize(segment.text).text;
		if (segment.attrs && normalized)
			ranges.push({ from: sentence.length, to: sentence.length + normalized.length, attrs: segment.attrs });
		sentence += normalized;
	});

	return { sentence, ranges };
};

const toDocRanges = (block: Block, offset: number, ranges: MarkedRange[]): MarkedRange[] => {
	const { map } = block.normalized;
	const contentStart = block.pos + 1;

	return ranges
		.map(({ from, to, attrs }) => {
			const rawFrom = map[offset + from];
			const rawTo = map[offset + to - 1];
			if (!rawFrom || !rawTo) return null;
			return { from: contentStart + rawFrom.start, to: contentStart + rawTo.end, attrs };
		})
		.filter(Boolean);
};

const locateBySentence = (blocks: Block[], sentence: string, ranges: MarkedRange[]): MarkedRange[] => {
	if (!sentence) return [];

	for (const block of blocks) {
		const offset = block.normalized.text.indexOf(sentence, block.cursor);
		if (offset === -1) continue;
		block.cursor = offset + sentence.length;
		return toDocRanges(block, offset, ranges);
	}

	return [];
};

const locateByFragments = (blocks: Block[], originalSentence: string, ranges: MarkedRange[]): MarkedRange[] => {
	const sentence = normalize(originalSentence ?? "").text;
	if (!sentence) return [];

	for (const block of blocks) {
		const offset = block.normalized.text.indexOf(sentence, block.cursor);
		if (offset === -1) continue;

		const sentenceText = block.normalized.text.slice(offset, offset + sentence.length);
		const found: MarkedRange[] = [];
		let cursor = 0;

		for (const range of ranges) {
			const fragment = sentenceText.slice(range.from, range.to);
			const from = sentenceText.indexOf(fragment, cursor);
			if (from === -1) continue;
			found.push({ from, to: from + fragment.length, attrs: range.attrs });
			cursor = from + fragment.length;
		}

		block.cursor = offset + sentence.length;
		return toDocRanges(block, offset, found);
	}

	return [];
};

const hasInlineLeaf = (doc: Node, from: number, to: number): boolean => {
	let found = false;
	doc.nodesBetween(from, to, (node) => {
		if (node.isInline && !node.isText) found = true;
	});
	return found;
};

const applySuggestions = (tr: Transaction, markType: MarkType, items: SuggestionItem[]): Transaction => {
	const blocks = collectBlocks(tr.doc);

	items.forEach((item) => {
		const segments = parseSuggestionHtml(item.suggestion);
		const { sentence, ranges } = getSegmentRanges(segments);
		if (!ranges.length) return;

		const located = locateBySentence(blocks, sentence, ranges);
		const docRanges = located.length ? located : locateByFragments(blocks, item.originalSentence, ranges);

		docRanges.forEach(({ from, to, attrs }) => {
			if (hasInlineLeaf(tr.doc, from, to)) return;

			tr.addMark(
				from,
				to,
				markType.create({
					name: attrs.name,
					description: attrs.description,
					text: attrs.text,
					originalText: tr.doc.textBetween(from, to),
				}),
			);
		});
	});

	return tr;
};

export default applySuggestions;
