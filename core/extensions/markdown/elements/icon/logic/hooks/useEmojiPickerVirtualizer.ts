import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import UiLanguage from "@ext/localization/core/model/Language";
import { getCurrentLanguage } from "@ext/localization/locale/translate";
import type { IconPickerSize } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef } from "react";

export interface EmojiEntry {
	emoji: string;
	category: string;
	ru: string[];
	en: string[];
}

type LabelRow = { type: "label"; category: string };
type EmojiRow = { type: "emojis"; emojis: string[] };
export type EmojiVirtualRow = LabelRow | EmojiRow;

const LABEL_ROW_HEIGHT = 28;
const EMOJI_ROW_HEIGHT = 28;
const GAP = 6;

const SIZE_COLS: Record<IconPickerSize, number> = {
	xs: 6,
	sm: 8,
	md: 10,
	lg: 12,
	xl: 14,
};

const chunk = <T>(arr: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
	return result;
};

const RECENTLY_USED_CATEGORY = "recently-used";

export const useEmojiPickerVirtualizer = (
	emojis: EmojiEntry[],
	query: string,
	size: IconPickerSize = "sm",
	lastUsedEmojis: string[] = [],
) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const cols = SIZE_COLS[size];

	const { rows, categoryRepresentatives } = useMemo(() => {
		const q = query.toLowerCase();
		const lang = getCurrentLanguage();
		const keywords = (e: EmojiEntry) => (lang === UiLanguage.ru ? e.ru : e.en);
		const filtered = q ? emojis.filter((e) => keywords(e).some((w) => w.toLowerCase().includes(q))) : emojis;

		if (q) {
			const rows: EmojiVirtualRow[] = chunk(
				filtered.map((e) => e.emoji),
				cols,
			).map((emojis) => ({ type: "emojis", emojis }));
			return { rows, categoryRepresentatives: {} as Record<string, string> };
		}

		const grouped = filtered.reduce<Record<string, string[]>>((acc, e) => {
			const group = e.category.replace(/\s*\(.*\)/, "").trim() || "Other";
			if (!acc[group]) acc[group] = [];
			acc[group].push(e.emoji);
			return acc;
		}, {});

		const categoryRepresentatives: Record<string, string | { code: IconCode }> = {};
		const rows: EmojiVirtualRow[] = [];

		if (lastUsedEmojis.length > 0) {
			const recent = [...lastUsedEmojis].reverse();
			categoryRepresentatives[RECENTLY_USED_CATEGORY] = { code: "clock" };
			rows.push(
				{ type: "label", category: RECENTLY_USED_CATEGORY } as LabelRow,
				...chunk(recent, cols).map((emojis) => ({ type: "emojis", emojis }) as EmojiRow),
			);
		}

		for (const [category, emojis] of Object.entries(grouped)) {
			categoryRepresentatives[category] = emojis[0];
			rows.push(
				{ type: "label", category } as LabelRow,
				...chunk(emojis, cols).map((emojis) => ({ type: "emojis", emojis }) as EmojiRow),
			);
		}

		return { rows, categoryRepresentatives };
	}, [emojis, query, cols, lastUsedEmojis]);

	const categoryIndexes = useMemo(() => {
		const result: Record<string, number> = {};
		rows.forEach((row, index) => {
			if (row.type === "label") result[row.category] = index;
		});
		return result;
	}, [rows]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: (index) => {
			const row = rows[index];
			return row.type === "label" ? LABEL_ROW_HEIGHT : EMOJI_ROW_HEIGHT + GAP;
		},
		overscan: 10,
	});

	const scrollToCategory = useCallback(
		(category: string) => {
			const index = categoryIndexes[category];
			if (index !== undefined) {
				virtualizer.scrollToIndex(index, { behavior: "smooth", align: "start" });
			}
		},
		[categoryIndexes, virtualizer],
	);

	return { scrollRef, virtualizer, rows, categoryRepresentatives, scrollToCategory };
};
