import type ContextService from "@core-ui/ContextServices/ContextService";
import type { ResourceFilter } from "@ext/serach/Searcher";
import { createContext, type Dispatch, type ReactElement, type SetStateAction, useContext, useState } from "react";

export type SearchScopeFilter = "all" | "catalog" | "article";

export interface SearchQueryServiceValue {
	query: string;
	setQuery: Dispatch<SetStateAction<string>>;
	resourceFilter: ResourceFilter;
	setResourceFilter: Dispatch<SetStateAction<ResourceFilter>>;
	hasOpenRequest: boolean;
	openRequestVersion: number;
	requestedScopeFilter?: SearchScopeFilter;
	requestOpen: (scopeFilter?: SearchScopeFilter) => void;
	clearOpenRequest: () => void;
}

const SearchQueryContext = createContext<SearchQueryServiceValue>(undefined);
class SearchQueryService implements ContextService {
	Init({ children }: { children: ReactElement }): ReactElement {
		const [query, setQuery] = useState<string>("");
		const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("with");
		const [hasOpenRequest, setHasOpenRequest] = useState<boolean>(false);
		const [openRequestVersion, setOpenRequestVersion] = useState<number>(0);
		const [requestedScopeFilter, setRequestedScopeFilter] = useState<SearchScopeFilter | undefined>(undefined);

		const requestOpen = (scopeFilter?: SearchScopeFilter) => {
			setRequestedScopeFilter(scopeFilter);
			setHasOpenRequest(true);
			setOpenRequestVersion((v) => v + 1);
		};
		const clearOpenRequest = () => {
			setHasOpenRequest(false);
			setRequestedScopeFilter(undefined);
		};

		return (
			<SearchQueryContext.Provider
				value={{
					query,
					setQuery,
					resourceFilter,
					setResourceFilter,
					hasOpenRequest,
					openRequestVersion,
					requestedScopeFilter,
					requestOpen,
					clearOpenRequest,
				}}
			>
				{children}
			</SearchQueryContext.Provider>
		);
	}

	get value(): SearchQueryServiceValue {
		return useContext(SearchQueryContext);
	}
}

export default new SearchQueryService();
