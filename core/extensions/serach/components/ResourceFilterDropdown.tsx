import t from "@ext/localization/locale/translate";
import { SearchFilterDropdown } from "@ext/serach/components/SearchFilterDropdown";
import type { ResourceFilter } from "../Searcher";

export interface ResourceFilterDropdownProps {
	resourceFilter: ResourceFilter;
	setResourceFilter: (resourceFilter: ResourceFilter) => void;
}

export const ResourceFilterDropdown = (props: ResourceFilterDropdownProps) => {
	const { resourceFilter, setResourceFilter } = props;
	const resourceFilterLabel = {
		without: t("search.resource-filter.without-resources"),
		with: t("search.resource-filter.with-resources"),
		only: t("search.resource-filter.only-resources"),
	};

	return (
		<SearchFilterDropdown
			labels={resourceFilterLabel}
			onSelect={(v) => setResourceFilter(v)}
			tooltip={t("search.resource-filter.tooltip")}
			value={resourceFilter}
			values={["without", "with", "only"]}
		/>
	);
};
