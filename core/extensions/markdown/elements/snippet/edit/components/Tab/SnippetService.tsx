import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import generateUniqueID from "@core/utils/generateUniqueID";
import { ProviderContextService, ProviderItemProps } from "@ext/articleProvider/models/types";
import ArticleSnippet from "@ext/markdown/elements/snippet/edit/components/Article/ArticleSnippet";
import { createContext, useContext, useState } from "react";

export type SnippetContextType = {
	snippets: Map<string, ProviderItemProps>;
	selectedID: string;
};

export const SnippetContext = createContext<SnippetContextType>({
	snippets: new Map(),
	selectedID: null,
});

class SnippetService implements ProviderContextService {
	private _setSnippets: (snippets: Map<string, ProviderItemProps>) => void = () => {};
	private _setSelectedID: (selectedID: string) => void = () => {};
	private _isNext: boolean;

	Init = ({ children }: { children: JSX.Element }): JSX.Element => {
		const [snippets, setSnippets] = useState<Map<string, ProviderItemProps>>(new Map());
		const [selectedID, setSelectedID] = useState<string>(null);
		const { isNext } = usePlatform();

		this._isNext = isNext;
		this._setSnippets = setSnippets;
		this._setSelectedID = setSelectedID;

		return <SnippetContext.Provider value={{ snippets, selectedID }}>{children}</SnippetContext.Provider>;
	};

	get value(): SnippetContextType {
		return useContext(SnippetContext);
	}

	async fetchItems(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getArticleListInGramaxDir("snippet");
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const snippets = await res.json();

		this.setItems(snippets);
	}

	setItems(snippets: ProviderItemProps[]) {
		this._setSnippets(new Map(snippets.map((snippet) => [snippet.id, snippet])));
	}

	closeItem() {
		ArticleViewService.setDefaultView();
		if (!this._isNext) refreshPage();
		this._setSelectedID(null);
	}

	openItem(snippet: ProviderItemProps) {
		NavigationTabsService.setTop(LeftNavigationTab.Snippets);
		ArticleViewService.setView(() => <ArticleSnippet item={snippet} />);
		this._setSelectedID(snippet.id);
	}

	async addNewSnippet(apiUrlCreator: ApiUrlCreator) {
		const uniqueID = generateUniqueID();
		await FetchService.fetch(apiUrlCreator.createFileInGramaxDir(uniqueID, "snippet"));

		const res = await FetchService.fetch<ProviderItemProps[]>(apiUrlCreator.getArticleListInGramaxDir("snippet"));
		if (!res.ok) return;

		const newSnippets = await res.json();
		this.setItems(newSnippets);

		const addedSnippet = newSnippets.find((snippet) => snippet.id === uniqueID);
		return addedSnippet;
	}
}

export default new SnippetService();
