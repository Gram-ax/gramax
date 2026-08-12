import { IconPickerFooter } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerFooter";
import { IconPickerList } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerList";
import type {
	IconPickerColor,
	OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { IconPickerEmptyState } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerEmptyState";
import { useCategoryScrollSpy } from "@ext/markdown/elements/icon/logic/hooks/useCategoryScrollSpy";
import type { CategoryWithIcon } from "@ext/markdown/elements/icon/logic/hooks/useIconPicker";
import type { IconEntry, IconPickerSize } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { useIconPickerVirtualizer } from "@ext/markdown/elements/icon/logic/hooks/useIconPickerVirtualizer";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { useRef } from "react";

interface IconPickerVirtualListProps {
	icons: IconEntry[] | Record<string, IconEntry[]>;
	categories: CategoryWithIcon;
	size: IconPickerSize;
	hasCategories: boolean;
	color: IconPickerColor;
	onChange?: OnChangeCallback;
}

export const IconPickerVirtualList = ({
	icons,
	categories,
	size,
	hasCategories,
	color,
	onChange,
}: IconPickerVirtualListProps) => {
	const categoriesRef = useRef<HTMLDivElement>(null);
	const { scrollRef, virtualizer, rows, scrollToCategory } = useIconPickerVirtualizer(icons, size);
	const { activeCategory } = useCategoryScrollSpy({ categoriesRef, containerRef: scrollRef, virtualizer, rows });

	const isEmpty = rows.length === 0;

	return (
		<>
			<ScrollShadowContainer className="overflow-y-auto flex-1 min-h-0 p-1" ref={scrollRef}>
				{isEmpty ? (
					<IconPickerEmptyState />
				) : (
					<IconPickerList color={color} onChange={onChange} rows={rows} virtualizer={virtualizer} />
				)}
			</ScrollShadowContainer>
			{hasCategories && (
				<IconPickerFooter
					activeCategory={activeCategory}
					categories={categories}
					ref={categoriesRef}
					scrollToCategory={scrollToCategory}
				/>
			)}
		</>
	);
};
