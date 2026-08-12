import { EmojiPickerFooter } from "@ext/markdown/elements/icon/edit/components/IconPicker/Emoji/EmojiPickerFooter";
import { EmojiPickerItem } from "@ext/markdown/elements/icon/edit/components/IconPicker/Emoji/EmojiPickerItem";
import { IconPickerEmptyState } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerEmptyState";
import { IconPickerLabel } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerLabel";
import { getEmojiCategoryName } from "@ext/markdown/elements/icon/edit/logic/getEmojiCategoryName";
import { useCategoryScrollSpy } from "@ext/markdown/elements/icon/logic/hooks/useCategoryScrollSpy";
import type { EmojiEntry } from "@ext/markdown/elements/icon/logic/hooks/useEmojiPickerVirtualizer";
import { useEmojiPickerVirtualizer } from "@ext/markdown/elements/icon/logic/hooks/useEmojiPickerVirtualizer";
import type { IconPickerSize } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { useLastUsedEmojis } from "@ext/markdown/elements/icon/logic/stores/EmojiDataStore";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { useRef } from "react";

export type { EmojiEntry };

interface EmojiPickerProps {
	emojis: EmojiEntry[];
	query: string;
	size?: IconPickerSize;
	onChange?: (emoji: string) => void;
}

export const EmojiPicker = ({ emojis, query, size = "sm", onChange }: EmojiPickerProps) => {
	const categoriesRef = useRef<HTMLDivElement>(null);
	const lastUsedEmojis = useLastUsedEmojis();
	const { scrollRef, virtualizer, rows, categoryRepresentatives, scrollToCategory } = useEmojiPickerVirtualizer(
		emojis,
		query,
		size,
		lastUsedEmojis,
	);
	const { activeCategory } = useCategoryScrollSpy({ categoriesRef, containerRef: scrollRef, virtualizer, rows });

	const totalSize = virtualizer.getTotalSize();
	const virtualItems = virtualizer.getVirtualItems();
	const hasCategories = !query && Object.keys(categoryRepresentatives).length > 0;
	const isEmpty = rows.length === 0;

	return (
		<>
			<ScrollShadowContainer className="overflow-y-auto flex-1 min-h-0 p-1" ref={scrollRef}>
				{isEmpty ? (
					<IconPickerEmptyState />
				) : (
					<div style={{ height: totalSize, position: "relative" }}>
						{virtualItems.map((item) => {
							const row = rows[item.index];
							if (!row) return null;
							return (
								<div
									key={item.key}
									style={{
										position: "absolute",
										top: item.start,
										left: 0,
										right: 0,
										height: item.size,
									}}
								>
									{row.type === "label" ? (
										<IconPickerLabel className="flex items-center h-full">
											{getEmojiCategoryName(row.category)}
										</IconPickerLabel>
									) : (
										<div className="flex gap-1.5">
											{row.emojis.map((emoji, i) => (
												<EmojiPickerItem
													emoji={emoji}
													key={`${item.index}-${i}`}
													onClick={onChange}
												/>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</ScrollShadowContainer>
			{hasCategories && (
				<EmojiPickerFooter
					activeCategory={activeCategory}
					categoryRepresentatives={categoryRepresentatives}
					ref={categoriesRef}
					scrollToCategory={scrollToCategory}
				/>
			)}
		</>
	);
};
