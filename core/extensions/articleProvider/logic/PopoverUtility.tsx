import { PopoverManager } from "@ext/articleProvider/logic/PopoverManager";
import { InboxArticle } from "@ext/inbox/models/types";

type SortableItem<T> = T & {
	props: {
		date: string;
	};
};

export default class PopoverUtility {
	public static getArticleID(fileName: string, date: string): string {
		return `${fileName}-${date}`;
	}

	public static sortByDate<T = unknown>(articles: SortableItem<T>[]): SortableItem<T>[] {
		return articles.sort((a, b) => this._sortByDate(a, b));
	}

	public static removeSelectedIds(paths: string[], ids: string | string[]): string[] {
		const newSelectedPaths = paths.filter((p) => (!Array.isArray(ids) ? p !== ids : !ids.includes(p)));
		return newSelectedPaths;
	}

	public static setSelectedIds(selectedIds: string[], newIds: string[]): string[] {
		const newSelectedIds = this.removeSelectedIds(selectedIds, newIds);
		newSelectedIds.push(...newIds);
		return newSelectedIds;
	}

	public static closeUnpinnedTooltips(tooltipManager: PopoverManager<InboxArticle>) {
		const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

		unpinnedTooltips.forEach((tooltip) => {
			tooltipManager.removeTooltip(tooltip);
		});
	}

	private static _sortByDate<T = unknown>(a: SortableItem<T>, b: SortableItem<T>): number {
		const dateA = a.props?.date;
		const dateB = b.props?.date;

		if (dateA && dateB) {
			return new Date(dateB).getTime() - new Date(dateA).getTime();
		}

		if (!dateA && dateB) return 1;
		if (dateA && !dateB) return -1;

		return 0;
	}
}
