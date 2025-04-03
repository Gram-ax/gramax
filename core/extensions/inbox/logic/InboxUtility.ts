import { InboxTooltipManager } from "@ext/inbox/logic/InboxTooltipsManager";
import { InboxArticle } from "@ext/inbox/models/types";

export default class InboxUtility {
	public static getArticleID(fileName: string, date: string): string {
		return `${fileName}-${date}`;
	}

	public static sortByDate(articles: InboxArticle[]): InboxArticle[] {
		return articles.sort(this._sortByDate);
	}

	public static removeSelectedPath(paths: string[], path: string | string[]): string[] {
		const newSelectedPaths = paths.filter((p) => (!Array.isArray(path) ? p !== path : !path.includes(p)));
		return newSelectedPaths;
	}

	public static setSelectedPath(selectedPaths: string[], newPaths: string[]): string[] {
		const newSelectedPaths = this.removeSelectedPath(selectedPaths, newPaths);
		newSelectedPaths.push(...newPaths);
		return newSelectedPaths;
	}

	public static closeUnpinnedTooltips(tooltipManager: InboxTooltipManager) {
		const unpinnedTooltips = tooltipManager.getUnpinnedTooltips();

		unpinnedTooltips.forEach((tooltip) => {
			tooltipManager.removeTooltip(tooltip);
		});
	}

	private static _sortByDate(a: InboxArticle, b: InboxArticle): number {
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
