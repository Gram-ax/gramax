import type ContextService from "@core-ui/ContextServices/ContextService";
import type { ResourceFilter } from "@ext/serach/Searcher";
import { createContext, type Dispatch, type ReactElement, type SetStateAction, useContext, useState } from "react";

export interface SearchQueryServiceValue {
	query: string;
	setQuery: Dispatch<SetStateAction<string>>;
	resourceFilter: ResourceFilter;
	setResourceFilter: Dispatch<SetStateAction<ResourceFilter>>;
}

const SearchQueryContext = createContext<SearchQueryServiceValue>(undefined);
class SearchQueryService implements ContextService {
	Init({ children }: { children: ReactElement }): ReactElement {
		const [query, setQuery] = useState<string>("");
		const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("with");
		return (
			<SearchQueryContext.Provider value={{ query, setQuery, resourceFilter, setResourceFilter }}>
				{children}
			</SearchQueryContext.Provider>
		);
	}

	get value(): SearchQueryServiceValue {
		return useContext(SearchQueryContext);
	}
}

export default new SearchQueryService();
