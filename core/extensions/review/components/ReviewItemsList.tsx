import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { ReviewListItem } from "@ext/review/components/ListItems/ReviewListItem";
import { ReviewListCounter } from "@ext/review/components/ReviewListCounter";
import type { GroupedItem, ScopedItemList } from "@ext/review/logic/hooks/useScopedItems";
import { useScrollToItem } from "@ext/review/logic/hooks/useScrollToItem";
import { useReviewNotificationsStore } from "@ext/review/logic/store/ReviewNotificationsStore";
import type { ReviewListItem as ReviewListItemModel } from "@ext/review/models/ReviewList";
import { useVirtualizer } from "@tanstack/react-virtual";
import { EmptyState } from "@ui-kit/EmptyState";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { forwardRef, type HTMLAttributes, useCallback, useMemo, useRef, useState } from "react";

type VirtualRow =
	| { type: "group-header"; label: string; items: ReviewListItemModel[]; unreadCount: number; groupKey: string }
	| { type: "item"; item: ReviewListItemModel };

interface GroupHeaderProps extends HTMLAttributes<HTMLButtonElement> {
	index: number;
	label: string;
	items: ReviewListItemModel[];
	unreadCount: number;
	open: boolean;
	onToggle: () => void;
}

interface ReviewItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
	index: number;
	item: ReviewListItemModel;
	onClick: (item: ReviewListItemModel) => void;
}

const getItemId = (item: ReviewListItemModel) => `${item.pathname}-${item.id}`;

const GroupHeader = forwardRef<HTMLButtonElement, GroupHeaderProps>(
	({ index, label, items, unreadCount, open, onToggle, ...props }, ref) => (
		<button
			className="flex items-center gap-1.5 w-full px-3 pt-3 pb-1 hover:bg-transparent uppercase cursor-pointer bg-transparent border-0"
			data-index={index}
			onClick={onToggle}
			ref={ref}
			type="button"
			{...props}
		>
			<TextOverflowTooltip className="truncate text-xs font-medium text-[var(--color-merge-request-text)]">
				{label}
			</TextOverflowTooltip>
			<ReviewListCounter count={items.length} unreadCount={unreadCount} />
			<Icon
				className={cn("ml-auto transition-transform duration-150 shrink-0", { "rotate-90": open })}
				icon={"chevron-right"}
			/>
		</button>
	),
);

const Item = forwardRef<HTMLDivElement, ReviewItemProps>(({ index, item, onClick, ...props }, ref) => {
	const isRead = useReviewNotificationsStore(
		(state) => !!state.notifications.find((n) => n.id === item?.id)?.viewedAt,
	);

	return (
		<div data-index={index} ref={ref} {...props}>
			<ReviewListItem {...item} isRead={isRead} onClick={() => onClick(item)} />
		</div>
	);
});

const buildFlatRows = (
	data: ScopedItemList,
	notifications: { id: string; viewedAt?: string }[],
	collapsedGroups: Set<string>,
): VirtualRow[] => {
	if (!data.isGrouped) {
		return (data.items as ReviewListItemModel[]).map((item) => ({ type: "item", item }));
	}

	const rows: VirtualRow[] = [];
	for (const [label, groupItems] of data.items as GroupedItem) {
		const groupKey = `${label}-${groupItems?.[0]?.pathname ?? groupItems.length}`;
		const unreadCount = groupItems.filter((item) => !notifications.find((n) => n.id === item.id)?.viewedAt).length;

		rows.push({ type: "group-header", label, items: groupItems, unreadCount, groupKey });
		if (!collapsedGroups.has(groupKey)) {
			for (const item of groupItems) {
				rows.push({ type: "item", item });
			}
		}
	}
	return rows;
};

export const ReviewItemsList = ({ data, isLoading }: { data: ScopedItemList; isLoading: boolean }) => {
	const onItemClick = useScrollToItem();
	const readItem = useReviewNotificationsStore((state) => state.readItem);
	const notifications = useReviewNotificationsStore((state) => state.notifications);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

	const onClickHandler = useCallback(
		(item: ReviewListItemModel) => {
			onItemClick(item);
			readItem(item.id);
		},
		[onItemClick, readItem],
	);

	const toggleGroup = useCallback((groupKey: string) => {
		setCollapsedGroups((prev) => {
			const next = new Set(prev);
			if (next.has(groupKey)) next.delete(groupKey);
			else next.add(groupKey);
			return next;
		});
	}, []);

	const flatRows = useMemo(
		() => buildFlatRows(data, notifications, collapsedGroups),
		[data, notifications, collapsedGroups],
	);

	const virtualizer = useVirtualizer({
		count: flatRows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => 64,
		overscan: 5,
		getItemKey: (index) => {
			const row = flatRows[index];
			return row.type === "group-header" ? `header-${row.groupKey}` : `item-${getItemId(row.item)}`;
		},
	});

	if (isLoading)
		return (
			<Loader className="py-6" size="md">
				{t("loading")}
			</Loader>
		);

	if (!data || !data?.count) return <EmptyState>{t("list.no-results-found")}</EmptyState>;

	const virtualItems = virtualizer.getVirtualItems();

	return (
		<ScrollShadowContainer className="flex-1 min-h-0 overflow-x-hidden" ref={scrollRef}>
			<div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
				{virtualItems.map((virtualItem) => {
					const row = flatRows[virtualItem.index];
					if (!row) return null;
					if (row.type === "group-header") {
						return (
							<GroupHeader
								index={virtualItem.index}
								items={row.items}
								key={virtualItem.key}
								label={row.label}
								onToggle={() => toggleGroup(row.groupKey)}
								open={!collapsedGroups.has(row.groupKey)}
								ref={virtualizer.measureElement}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									transform: `translateY(${virtualItem.start}px)`,
								}}
								unreadCount={row.unreadCount}
							/>
						);
					}
					if (!row.item) return null;
					return (
						<Item
							index={virtualItem.index}
							item={row.item}
							key={virtualItem.key}
							onClick={onClickHandler}
							ref={virtualizer.measureElement}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								transform: `translateY(${virtualItem.start}px)`,
							}}
						/>
					);
				})}
			</div>
		</ScrollShadowContainer>
	);
};
