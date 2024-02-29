import { NavRules } from "@ext/navigation/catalog/main/logic/Navigation";
import Rules from "@ext/rules/Rule";

export default class ShowHomePageRules implements Rules {
	getItemFilter() {
		return () => true;
	}

	getNavRules(): NavRules {
		return {
			catalogRule: (catalog) => {
				return catalog.props[showHomePageProps.showHomePage] ?? true;
			},
		};
	}
}

export enum showHomePageProps {
	showHomePage = "showHomePage",
}
