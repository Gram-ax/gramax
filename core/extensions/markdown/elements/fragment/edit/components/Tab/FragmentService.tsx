import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import generateUniqueID from "@core/utils/generateUniqueID";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { ProviderContextService, ProviderItemProps } from "@ext/articleProvider/models/types";
import ArticleFragment from "@ext/markdown/elements/fragment/edit/components/Article/ArticleFragment";
import { createContext, useContext, useState } from "react";

export type FragmentContextType = {
	fragments: Map<string, ProviderItemProps>;
	selectedID: string;
};

export const FragmentContext = createContext<FragmentContextType>({
	fragments: new Map(),
	selectedID: null,
});

class FragmentService implements ProviderContextService {
	private _setFragments: (fragments: Map<string, ProviderItemProps>) => void = () => {};
	private _setSelectedID: (selectedID: string) => void = () => {};
	private _isNext: boolean;

	Init = ({ children }: { children: JSX.Element }): JSX.Element => {
		const [fragments, setFragments] = useState<Map<string, ProviderItemProps>>(new Map());
		const [selectedID, setSelectedID] = useState<string>(null);
		const { isNext } = usePlatform();

		this._isNext = isNext;
		this._setFragments = setFragments;
		this._setSelectedID = setSelectedID;

		return <FragmentContext.Provider value={{ fragments, selectedID }}>{children}</FragmentContext.Provider>;
	};

	get value(): FragmentContextType {
		return useContext(FragmentContext);
	}

	async fetchItems(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getArticleListInGramaxDir("fragment");
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const fragments = await res.json();

		this.setItems(fragments);
	}

	setItems(fragments: ProviderItemProps[]) {
		this._setFragments(new Map(fragments.map((fragment) => [fragment.id, fragment])));
	}

	closeItem() {
		ArticleViewService.setDefaultView();
		if (!this._isNext) refreshPage();
		this._setSelectedID(null);
	}

	openItem(fragment: ProviderItemProps) {
		NavigationTabsService.setTop(LeftNavigationTab.Fragments);
		ArticleViewService.setView(() => <ArticleFragment item={fragment} />);
		this._setSelectedID(fragment.id);
	}

	async addNewFragment(apiUrlCreator: ApiUrlCreator) {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "fragment"));

		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("fragment"));
		if (!res.ok) return;

		const newFragments = await res.json();
		this.setItems(newFragments);

		const addedFragment = newFragments.find((fragment) => fragment.id === uniqueID);
		return addedFragment;
	}
}

export default new FragmentService();
