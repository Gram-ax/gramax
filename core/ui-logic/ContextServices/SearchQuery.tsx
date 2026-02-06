import ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useState } from "react";

const SearchQueryContext = createContext<string>(undefined);
class SearchQueryService implements ContextService {
	private _setQuery: Dispatch<SetStateAction<string>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [query, setQuery] = useState<string>("");
		this._setQuery = setQuery;
		return <SearchQueryContext.Provider value={query}>{children}</SearchQueryContext.Provider>;
	}

	get value(): string {
		return useContext(SearchQueryContext);
	}

	set value(value: string) {
		this._setQuery(value);
	}
}

export default new SearchQueryService();
