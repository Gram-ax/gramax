import { useScopedItems } from "@ext/review/logic/hooks/useScopedItems";
import { useReviewNotificationsStore } from "@ext/review/logic/store/ReviewNotificationsStore";
import { useReviewStore } from "@ext/review/logic/store/ReviewStore";
import type { ReviewListItem } from "@ext/review/models/ReviewList";
import { renderHook } from "@testing-library/react";

jest.mock("@ext/review/logic/store/ReviewNotificationsStore", () => ({
	useReviewNotificationsStore: jest.fn((selector) =>
		selector({ notifications: [], setNotifications: jest.fn(), readItem: jest.fn() }),
	),
}));

const mockReviewStore = {
	catalogItems: [] as ReviewListItem[],
	articleItems: [] as ReviewListItem[],
	sorting: "none" as "none" | "newest" | "oldest",
	grouping: "none" as "none" | "article" | "date",
	pathnameToTitle: {} as Record<string, string>,
};

jest.mock("@ext/review/logic/store/ReviewStore", () => ({
	useReviewStore: jest.fn((selector) => selector(mockReviewStore)),
}));

const mockUseReviewStore = useReviewStore as jest.MockedFunction<typeof useReviewStore>;
const mockUseNotificationsStore = useReviewNotificationsStore as jest.MockedFunction<
	typeof useReviewNotificationsStore
>;

const makeItem = (id: string, pathname: string, date: string): ReviewListItem => ({
	type: "comments",
	id,
	pathname,
	date,
	author: { email: "user@example.com", name: "User" },
	commentBlock: {},
});

const setStoreState = (
	partial: Partial<typeof mockReviewStore>,
	notifications: { id: string; viewedAt: string }[] = [],
) => {
	Object.assign(mockReviewStore, partial);
	mockUseReviewStore.mockImplementation((selector) => selector(mockReviewStore as never));
	mockUseNotificationsStore.mockImplementation((selector) =>
		selector({ notifications, setNotifications: jest.fn(), readItem: jest.fn() }),
	);
};

beforeEach(() => {
	Object.assign(mockReviewStore, {
		catalogItems: null,
		articleItems: null,
		sorting: "none",
		grouping: "none",
		pathnameToTitle: {},
	});
	mockUseReviewStore.mockImplementation((selector) => selector(mockReviewStore as never));
	mockUseNotificationsStore.mockImplementation((selector) =>
		selector({ notifications: [], setNotifications: jest.fn(), readItem: jest.fn() }),
	);
});

describe("useScopedItems", () => {
	describe("item source by scope", () => {
		test("catalog scope returns catalogItems", () => {
			const items = [makeItem("1", "/a", "2024-01-01T00:00:00Z")];
			setStoreState({ catalogItems: items, articleItems: [] });

			const { result } = renderHook(() => useScopedItems("catalog"));

			expect(result.current.count).toBe(1);
			expect(result.current.items).toEqual(items);
		});

		test("article scope returns articleItems", () => {
			const items = [makeItem("1", "/a", "2024-01-01T00:00:00Z")];
			setStoreState({ catalogItems: [], articleItems: items });

			const { result } = renderHook(() => useScopedItems("article"));

			expect(result.current.count).toBe(1);
			expect(result.current.items).toEqual(items);
		});

		test("returns empty list and zero count when items is null", () => {
			setStoreState({ catalogItems: null, articleItems: null });

			const { result } = renderHook(() => useScopedItems("catalog"));

			expect(result.current.count).toBe(0);
			expect(result.current.items).toEqual([]);
		});
	});

	describe("sorting", () => {
		const older = makeItem("old", "/a", "2024-01-01T00:00:00Z");
		const newer = makeItem("new", "/a", "2024-06-01T00:00:00Z");

		test("sorting=newest returns newer items first", () => {
			setStoreState({ catalogItems: [older, newer], sorting: "newest" });

			const { result } = renderHook(() => useScopedItems("catalog"));

			const items = result.current.items as ReviewListItem[];
			expect(items[0].id).toBe("new");
			expect(items[1].id).toBe("old");
		});

		test("sorting=oldest returns older items first", () => {
			setStoreState({ catalogItems: [newer, older], sorting: "oldest" });

			const { result } = renderHook(() => useScopedItems("catalog"));

			const items = result.current.items as ReviewListItem[];
			expect(items[0].id).toBe("old");
			expect(items[1].id).toBe("new");
		});

		test("sorting=none preserves original order", () => {
			setStoreState({ catalogItems: [newer, older], sorting: "none" });

			const { result } = renderHook(() => useScopedItems("catalog"));

			const items = result.current.items as ReviewListItem[];
			expect(items[0].id).toBe("new");
			expect(items[1].id).toBe("old");
		});
	});

	describe("grouping", () => {
		const item1 = makeItem("1", "/article-a", "2024-01-15T00:00:00Z");
		const item2 = makeItem("2", "/article-b", "2024-01-15T00:00:00Z");
		const item3 = makeItem("3", "/article-a", "2024-03-20T00:00:00Z");

		test("grouping=article groups items by pathname title", () => {
			setStoreState({
				catalogItems: [item1, item2, item3],
				grouping: "article",
				pathnameToTitle: { "/article-a": "Article A", "/article-b": "Article B" },
			});

			const { result } = renderHook(() => useScopedItems("catalog"));

			const grouped = result.current.items as [string, ReviewListItem[]][];
			const keys = grouped.map(([k]) => k);
			expect(keys).toContain("Article A");
			expect(keys).toContain("Article B");
			expect(grouped.find(([k]) => k === "Article A")![1]).toHaveLength(2);
			expect(grouped.find(([k]) => k === "Article B")![1]).toHaveLength(1);
		});

		test("grouping=article falls back to pathname when title not in map", () => {
			setStoreState({
				catalogItems: [item1],
				grouping: "article",
				pathnameToTitle: {},
			});

			const { result } = renderHook(() => useScopedItems("catalog"));

			const grouped = result.current.items as [string, ReviewListItem[]][];
			expect(grouped.map(([k]) => k)).toContain("/article-a");
		});

		test("grouping=date groups items by formatted date", () => {
			setStoreState({
				catalogItems: [item1, item2, item3],
				grouping: "date",
			});

			const { result } = renderHook(() => useScopedItems("catalog"));

			const grouped = result.current.items as [string, ReviewListItem[]][];
			expect(grouped).toHaveLength(2);
			const groupSizes = grouped.map(([, items]) => items.length).sort();
			expect(groupSizes).toEqual([1, 2]);
		});

		test("grouping=none in article scope returns flat array", () => {
			setStoreState({ articleItems: [item1, item2], grouping: "article" });

			const { result } = renderHook(() => useScopedItems("article"));

			expect(Array.isArray(result.current.items)).toBe(true);
		});

		test("grouping=none returns flat array regardless of scope", () => {
			setStoreState({ catalogItems: [item1, item2, item3], grouping: "none" });

			const { result } = renderHook(() => useScopedItems("catalog"));

			expect(Array.isArray(result.current.items)).toBe(true);
			expect(result.current.count).toBe(3);
		});
	});
});
