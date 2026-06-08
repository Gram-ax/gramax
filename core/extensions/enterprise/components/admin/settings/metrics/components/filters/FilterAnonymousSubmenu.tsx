import type { AnonymousFilter } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import { DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import type { FC } from "react";

interface FilterAnonymousSubmenuProps {
	value: AnonymousFilter;
	onChange: (value: AnonymousFilter) => void;
}

const FilterAnonymousSubmenu: FC<FilterAnonymousSubmenuProps> = ({ value, onChange }) => {
	return (
		<>
			<DropdownMenuLabel>{t("metrics.filters.anonymous.label")}</DropdownMenuLabel>
			<DropdownMenuRadioGroup onValueChange={(v) => onChange(v as AnonymousFilter)} value={value}>
				<DropdownMenuRadioItem value="all">{t("metrics.filters.anonymous.all")}</DropdownMenuRadioItem>
				<DropdownMenuRadioItem value="registered">
					{t("metrics.filters.anonymous.registered")}
				</DropdownMenuRadioItem>
				<DropdownMenuRadioItem value="anonymous">
					{t("metrics.filters.anonymous.anonymous")}
				</DropdownMenuRadioItem>
			</DropdownMenuRadioGroup>
		</>
	);
};

export default FilterAnonymousSubmenu;
