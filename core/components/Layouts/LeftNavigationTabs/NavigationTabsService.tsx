import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import React, { ReactElement, SetStateAction, useContext, useState } from "react";

type NavigationTabs = {
	topTab: LeftNavigationTab;
	bottomTab: LeftNavigationTab;
};

const NavigationTabsContext = React.createContext<NavigationTabs>({
	topTab: undefined,
	bottomTab: undefined,
});

class NavigationTabsService {
	private _setTopTab: React.Dispatch<React.SetStateAction<LeftNavigationTab>>;
	private _setBottomTab: React.Dispatch<React.SetStateAction<LeftNavigationTab>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [topTab, setTopTab] = useState<LeftNavigationTab>(undefined);
		const [bottomTab, setBottomTab] = useState<LeftNavigationTab>(undefined);

		this._setTopTab = setTopTab;
		this._setBottomTab = setBottomTab;

		return this.Provider({ children, value: { topTab, bottomTab } });
	}

	Provider({ children, value }: { children: ReactElement; value: NavigationTabs }): ReactElement {
		return <NavigationTabsContext.Provider value={value}>{children}</NavigationTabsContext.Provider>;
	}

	get value(): NavigationTabs {
		return useContext(NavigationTabsContext);
	}

	setTop(topTab: SetStateAction<LeftNavigationTab>) {
		this._setTopTab(topTab);
	}

	setBottom(bottomTab: SetStateAction<LeftNavigationTab>) {
		this._setBottomTab(bottomTab);
	}
}

export default new NavigationTabsService();
