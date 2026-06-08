const catalogSearchScopes = ["all", "catalog", "article"] as const;
const sectionSearchScopes = ["all", "folder"] as const;

// Catalog - Search in catalog
// Homepage - Search in homepage (if not in folder)
// Section - Search in homepage folder
export type SearchScopeMode = "catalog" | "homepage" | "section";

export type CatalogSearchScope = (typeof catalogSearchScopes)[number];
export type SectionSearchScope = (typeof sectionSearchScopes)[number];

export type ScopeByMode = {
	catalog: CatalogSearchScope;
	section: SectionSearchScope;
	homepage: never;
};

export type SearchScope<M extends SearchScopeMode = SearchScopeMode> = ScopeByMode[M];

export const scopesByMode: { [M in SearchScopeMode]: SearchScope<M>[] } = {
	catalog: [...catalogSearchScopes],
	section: [...sectionSearchScopes],
	homepage: [],
};

const nextCatalogSearchScope: Record<CatalogSearchScope, CatalogSearchScope> = {
	all: "catalog",
	catalog: "article",
	article: "all",
};

const nextSectionSearchScope: Record<SectionSearchScope, SectionSearchScope> = {
	all: "folder",
	folder: "all",
};

export const nextSearchScope = (
	mode: SearchScopeMode,
	scopeFilter: SearchScope<SearchScopeMode>,
): SearchScope<SearchScopeMode> => {
	switch (mode) {
		case "catalog":
			return nextCatalogSearchScope[scopeFilter] ?? initialScopeByMode[mode];
		case "section":
			return nextSectionSearchScope[scopeFilter] ?? initialScopeByMode[mode];
		default:
			return initialScopeByMode[mode];
	}
};

export const initialScopeByMode: Record<SearchScopeMode, SearchScope> = {
	catalog: "catalog",
	section: "folder",
	homepage: "all",
};
