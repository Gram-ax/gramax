import { useReviewNotificationsStore } from "@ext/review/logic/store/ReviewNotificationsStore";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import type { ReviewListItem, ReviewScope } from "@ext/review/models/ReviewList";
import { useMemo } from "react";

export type Item = ReviewListItem;

export type GroupedItem = [string, Item[]][];

export type ScopedItems = Item[] | GroupedItem;

export type ScopedItemList = {
	count: number;
	items: ScopedItems;
	isGrouped: boolean;
	unreadCount: number;
};

export const useScopedItems = (scope: ReviewScope): ScopedItemList => {
	const { items, sorting, grouping, pathnameToTitle } = useReviewStore((s) => ({
		items: scope === "catalog" ? s.catalogItems : s.articleItems,
		sorting: s.sorting,
		grouping: s.grouping,
		pathnameToTitle: s.pathnameToTitle,
	}));

	const notifications = useReviewNotificationsStore((state) => state.notifications);

	const notifMap = useMemo(() => new Map(notifications.map((n) => [n.id, n])), [notifications]);

	const { groupedItems, count, isGrouped } = useMemo(() => {
		if (!items) return { groupedItems: [] as ScopedItems, count: 0, isGrouped: false };

		let withTime = items.slice().map((item) => ({ item, t: Date.parse(item.date) }));

		if (sorting === "newest") withTime = withTime.sort((a, b) => b.t - a.t);
		else if (sorting === "oldest") withTime = withTime.sort((a, b) => a.t - b.t);

		const sorted = withTime.map((x) => x.item);

		if (grouping !== "none") {
			if (scope === "article" && grouping === "article") {
				return { groupedItems: sorted, count: sorted.length, isGrouped: false };
			}

			const map = new Map<string, ReviewListItem[]>();
			for (const item of sorted) {
				const key =
					grouping === "date"
						? new Date(item.date).toLocaleDateString(undefined, {
								day: "numeric",
								month: "long",
								year: "numeric",
							})
						: (pathnameToTitle[item.pathname] ?? item.pathname);

				const group = map.get(key);
				if (group) group.push(item);
				else map.set(key, [item]);
			}

			return { groupedItems: Array.from(map.entries()) as GroupedItem, count: sorted.length, isGrouped: true };
		}

		return { groupedItems: sorted, count: sorted.length, isGrouped: false };
	}, [items, sorting, scope, grouping, pathnameToTitle]);

	const unreadCount = useMemo(() => {
		if (!Array.isArray(groupedItems) || groupedItems.length === 0) return 0;
		if (Array.isArray(groupedItems[0])) {
			return (groupedItems as GroupedItem).reduce(
				(acc, [, group]) => acc + group.filter((item) => !notifMap.get(item.id)?.viewedAt).length,
				0,
			);
		}
		return (groupedItems as Item[]).filter((item) => !notifMap.get(item.id)?.viewedAt).length;
	}, [groupedItems, notifMap]);

	return useMemo(
		() => ({ count, items: groupedItems, isGrouped, unreadCount }),
		[count, groupedItems, isGrouped, unreadCount],
	);
};
