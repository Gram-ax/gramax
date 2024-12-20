import type { EventHandlerCollection } from "@core/Event/EventHandlerProvider";
import type RuleCollection from "@ext/events/RuleCollection";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";

const SHOW_HOMEPAGE_PROP_NAME = "showHomePage";

export default class ShowHomePageRules implements RuleCollection, EventHandlerCollection {
	constructor(private _nav?: Navigation) {}

	mount() {
		this._nav.events.on("filter-catalog", ({ entry }) => entry.props[SHOW_HOMEPAGE_PROP_NAME] || true);
	}

	getItemFilter() {
		return () => true;
	}
}
