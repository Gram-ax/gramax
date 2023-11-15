import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

const SearchQueryContext = createContext<string>(undefined);
let _setQuery: Dispatch<SetStateAction<string>>;
abstract class SearchQueryService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [query, setQuery] = useState<string>("");
		_setQuery = setQuery;
		return <SearchQueryContext.Provider value={query}>{children}</SearchQueryContext.Provider>;
	}

	static get value(): string {
		return useContext(SearchQueryContext);
	}

	static set value(value: string) {
		_setQuery(value);
	}
}

export default SearchQueryService;
