import t from "@ext/localization/locale/translate";
import { SearchFilterDropdown } from "@ext/serach/components/SearchFilterDropdown";
import { type SearchScope, type SearchScopeMode, scopesByMode } from "@ext/serach/components/SearchScope";

export interface ScopeFilterDropdownProps<M extends SearchScopeMode> {
	mode: M;
	isCategory: boolean;
	scopeFilter: SearchScope<M>;
	setScopeFilter: (scopeFilter: SearchScope<M>) => void;
}

export const ScopeFilterDropdown = <M extends SearchScopeMode>(props: ScopeFilterDropdownProps<M>) => {
	const { mode, isCategory, scopeFilter, setScopeFilter } = props;
	const scopeFilterLabel = {
		all: t("search.scope-filter.all"),
		catalog: t("search.scope-filter.catalog"),
		article: isCategory ? t("search.scope-filter.category") : t("search.scope-filter.article"),
		folder: t("search.scope-filter.folder"),
	};

	return (
		<SearchFilterDropdown
			labels={scopeFilterLabel}
			onSelect={(v) => setScopeFilter(v)}
			tooltip={t("search.scope-filter.tooltip")}
			value={scopeFilter}
			values={scopesByMode[mode]}
		/>
	);
};
