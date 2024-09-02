import type { HasEvents } from "@core/Event/EventEmitter";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";
import type RuleCollection from "@ext/rules/RuleCollection";

const SHOW_HOMEPAGE_PROP_NAME = "showHomePage";

export default class ShowHomePageRules implements RuleCollection {
	mountWorkspaceEvents(): void {}
	getItemFilter() {
		return () => true;
	}

	mountNavEvents(nav: HasEvents<NavigationEvents>) {
		nav.events.on("filter-catalog", ({ entry }) => entry.props[SHOW_HOMEPAGE_PROP_NAME] || true);
	}
}
