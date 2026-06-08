import { DropdownMenuTrigger, DropdownMenuTriggerButton } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import type { FC } from "react";

interface FilterDropdownTriggerProps {
	disabled: boolean;
	hasActiveFilters: boolean;
}

const FilterDropdownTrigger: FC<FilterDropdownTriggerProps> = ({ disabled, hasActiveFilters }) => {
	return (
		<DropdownMenuTrigger asChild>
			<div className="relative">
				<DropdownMenuTriggerButton className="h-9 w-9 p-0" disabled={disabled} variant="outline">
					<Icon icon="filter" size="md" />
				</DropdownMenuTriggerButton>
				{hasActiveFilters && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />}
			</div>
		</DropdownMenuTrigger>
	);
};

export default FilterDropdownTrigger;
