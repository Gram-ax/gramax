import type { EmojiEntry } from "@ext/markdown/elements/icon/logic/hooks/useEmojiPickerVirtualizer";
import enData from "emojibase-data/en/compact.json";
import ruData from "emojibase-data/ru/compact.json";

const EXCLUDED_GROUPS = new Set([2]);

const GROUP_CATEGORY: Record<number, string> = {
	0: "smileys-emotion",
	1: "people-body",
	3: "animals-nature",
	4: "food-drink",
	5: "travel-places",
	6: "activities",
	7: "objects",
	8: "symbols",
	9: "flags",
};

const ruByHexcode = new Map(ruData.map((e) => [e.hexcode, e]));

const buildEmojiData = (): EmojiEntry[] => {
	const result: EmojiEntry[] = [];

	for (const en of enData) {
		if (en.group === undefined || EXCLUDED_GROUPS.has(en.group)) continue;
		const category = GROUP_CATEGORY[en.group];
		if (!category) continue;

		const ru = ruByHexcode.get(en.hexcode);
		const enKeywords = en.tags ?? [en.label];
		const ruKeywords = ru?.tags ?? (ru?.label ? [ru.label] : enKeywords);

		result.push({ emoji: en.unicode, category, en: enKeywords, ru: ruKeywords });
	}

	return result;
};

export const emojis: EmojiEntry[] = buildEmojiData();
