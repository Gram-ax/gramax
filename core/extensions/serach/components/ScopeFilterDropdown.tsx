import t from "@ext/localization/locale/translate";
import { SearchFilterDropdown } from "@ext/serach/components/SearchFilterDropdown";

export type ScopeFilter = "all" | "catalog" | "article";

export interface ScopeFilterDropdownProps {
	isCategory: boolean;
	scopeFilter: ScopeFilter;
	setScopeFilter: (scopeFilter: ScopeFilter) => void;
}

export const ScopeFilterDropdown = (props: ScopeFilterDropdownProps) => {
	const { isCategory, scopeFilter, setScopeFilter } = props;
	const scopeFilterLabel = {
		all: t("search.scope-filter.all"),
		catalog: t("search.scope-filter.catalog"),
		article: isCategory ? t("search.scope-filter.category") : t("search.scope-filter.article"),
	};

	return (
		<SearchFilterDropdown
			labels={scopeFilterLabel}
			onSelect={(v) => setScopeFilter(v)}
			tooltip={t("search.scope-filter.tooltip")}
			value={scopeFilter}
			values={["all", "catalog", "article"]}
		/>
	);
};
