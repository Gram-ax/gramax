import { Locator } from "@playwright/test";
import el from "../../logic/utils/el";

export interface CatalogCard {
	el: Locator;
	getAction: (title: string) => Locator;
}

export function getAppActions(parentEl: Locator): CatalogCard {
	const actions = parentEl.locator(el("app-actions"));

	return {
		el: actions,
		getAction(title: string) {
			return actions.locator(`${el("app-action")}:has-text("${title}")`);
		},
	};
}
