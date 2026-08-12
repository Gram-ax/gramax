import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef } from "react";

export type IconEntry = { code: IconCode; svg?: string };

type LabelRow = { type: "label"; category: string };

type IconsRow = { type: "icons"; icons: IconEntry[] };

export type VirtualRow = LabelRow | IconsRow;

export type IconPickerSize = "xs" | "sm" | "md" | "lg" | "xl";

const LABEL_ROW_HEIGHT = 28;
const ICON_ROW_HEIGHT = 28;
const ITEM_WIDTH = 28;
const GAP = 6;
const PADDING = 4;

const SIZE_COLS: Record<IconPickerSize, number> = {
	xs: 6,
	sm: 8,
	md: 10,
	lg: 12,
	xl: 14,
};

const colsToWidth = (cols: number) => cols * (ITEM_WIDTH + GAP) - GAP + PADDING * 2;

export const getIconPickerWidth = (size: IconPickerSize) => colsToWidth(SIZE_COLS[size]);

const chunk = <T>(arr: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
	return result;
};

export const useIconPickerVirtualizer = (
	icons: IconEntry[] | Record<string, IconEntry[]>,
	size: IconPickerSize = "md",
) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const cols = SIZE_COLS[size];
	const exactWidth = colsToWidth(cols);

	const rows = useMemo<VirtualRow[]>(
		() =>
			Array.isArray(icons)
				? chunk(icons, cols).map((icons) => ({ type: "icons", icons }))
				: Object.entries(icons).flatMap(([category, catIcons]) => [
						{ type: "label", category } as LabelRow,
						...chunk(catIcons, cols).map((icons) => ({ type: "icons", icons }) as IconsRow),
					]),
		[icons, cols],
	);

	const categoryIndexes = useMemo(() => {
		const result: Record<string, number> = {};

		rows.forEach((row, index) => {
			if (row.type === "label") result[row.category] = index;
		});

		return result;
	}, [rows]);

	const estimateSize = useCallback(
		(index: number) => {
			const row = rows[index];
			return row.type === "label" ? LABEL_ROW_HEIGHT : ICON_ROW_HEIGHT + GAP;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[rows],
	);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize,
		overscan: 10,
	});

	const scrollToCategory = useCallback(
		(category: string) => {
			const index = categoryIndexes[category];
			if (index !== undefined) {
				virtualizer.scrollToIndex(index, {
					behavior: "smooth",
					align: "start",
				});
			}
		},
		[categoryIndexes, virtualizer],
	);

	return { scrollRef, virtualizer, rows, exactWidth, scrollToCategory };
};
