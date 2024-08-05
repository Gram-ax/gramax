import {
	flatTitleItems,
	getTitleItemsByTocItems,
} from "@ext/markdown/elements/link/edit/logic/titleItemsActions/getTitleItemsByTocItems";

describe("titleItemsActions", () => {
	describe("getTitleItemsByTocItems", () => {
		it("Проверка функции", () => {
			const rawTocItems =
				'[{"level":2,"title":"sasaasa","url":"#sasaasa","items":[{"level":3,"title":"asd","url":"#asd","items":[{"level":4,"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[]}]},{"level":3,"title":"asdsa","url":"#asdsa","items":[]}]},{"level":2,"title":"er","url":"#er","items":[{"level":3,"title":"Test","url":"#test","items":[]}]},{"level":2,"title":"sasa","url":"#sasa","items":[{"level":3,"title":"asd","url":"#asd","items":[{"level":4,"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[]}]},{"level":3,"title":"asdsa","url":"#asdsa","items":[]}]},{"level":2,"title":"er","url":"#er","items":[{"level":3,"title":"RATATA","url":"#ratata","items":[]}]}]';
			const tocItems = JSON.parse(rawTocItems);
			const titleItemsByTocItems = getTitleItemsByTocItems(tocItems);

			const rawTitleItems =
				'[{"title":"sasaasa","url":"#sasaasa","items":[{"title":"asd","url":"#asd","items":[{"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[],"level":0}],"level":0},{"title":"asdsa","url":"#asdsa","items":[],"level":0}],"level":0},{"title":"er","url":"#er","items":[{"title":"Test","url":"#test","items":[],"level":0}],"level":0},{"title":"sasa","url":"#sasa","items":[{"title":"asd","url":"#asd","items":[{"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[],"level":0}],"level":0},{"title":"asdsa","url":"#asdsa","items":[],"level":0}],"level":0},{"title":"er","url":"#er","items":[{"title":"RATATA","url":"#ratata","items":[],"level":0}],"level":0}]';
			const titleItems = JSON.parse(rawTitleItems);

			expect(titleItems).toEqual(titleItemsByTocItems);
		});
	});
	describe("flatTitleItems", () => {
		it("Проверка функции", () => {
			const rawTitleItems =
				'[{"title":"sasaasa","url":"#sasaasa","items":[{"title":"asd","url":"#asd","items":[{"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[],"level":0}],"level":0},{"title":"asdsa","url":"#asdsa","items":[],"level":0}],"level":0},{"title":"er","url":"#er","items":[{"title":"Test","url":"#test","items":[],"level":0}],"level":0},{"title":"sasa","url":"#sasa","items":[{"title":"asd","url":"#asd","items":[{"title":"dasasdsdasdssd","url":"#dasasdsdasdssd","items":[],"level":0}],"level":0},{"title":"asdsa","url":"#asdsa","items":[],"level":0}],"level":0},{"title":"er","url":"#er","items":[{"title":"RATATA","url":"#ratata","items":[],"level":0}],"level":0}]';
			const titleItems = JSON.parse(rawTitleItems);
			const flatItems = [];

			flatTitleItems(titleItems, 0, flatItems);

			const rawFlatTitleItems =
				'[{"title":"sasaasa","level":0,"url":"#sasaasa"},{"title":"asd","level":1,"url":"#asd"},{"title":"dasasdsdasdssd","level":2,"url":"#dasasdsdasdssd"},{"title":"asdsa","level":1,"url":"#asdsa"},{"title":"er","level":0,"url":"#er"},{"title":"Test","level":1,"url":"#test"},{"title":"sasa","level":0,"url":"#sasa"},{"title":"asd","level":1,"url":"#asd"},{"title":"dasasdsdasdssd","level":2,"url":"#dasasdsdasdssd"},{"title":"asdsa","level":1,"url":"#asdsa"},{"title":"er","level":0,"url":"#er"},{"title":"RATATA","level":1,"url":"#ratata"}]';

			const titleItemsByRaw = JSON.parse(rawFlatTitleItems);

			expect(titleItemsByRaw).toEqual(flatItems);
		});
	});
});
