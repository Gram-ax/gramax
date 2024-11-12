import type { HasEvents } from "@core/Event/EventEmitter";
import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type RuleCollection from "@ext/events/RuleCollection";
import { type NavigationEvents } from "@ext/navigation/catalog/main/logic/Navigation";

const SHOW_HOMEPAGE_PROP_NAME = "showHomePage";

export default class ShowHomePageRules implements RuleCollection, EventHandlerCollection<NavigationEvents> {
	mount(nav: HasEvents<NavigationEvents>): void {
		nav.events.on("filter-catalog", ({ entry }) => entry.props[SHOW_HOMEPAGE_PROP_NAME] || true);
	}

	getItemFilter() {
		return () => true;
	}
}
