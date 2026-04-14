import Icon from "@components/Atoms/Icon";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export interface SearchFilterDropdownProps<T extends string> {
	value: T;
	values: T[];
	labels: Record<T, string>;
	onSelect: (value: T) => void;
	tooltip?: string;
}

export const SearchFilterDropdown = <T extends string>(props: SearchFilterDropdownProps<T>) => {
	const { value, values, labels, onSelect, tooltip } = props;

	return (
		<DropdownMenu>
			<TooltipWrapper tooltip={tooltip}>
				<DropdownMenuTriggerButton asChild className="bottom-content-filter-dropdown-trigger" variant="text">
					{labels[value]}
					<Icon code="chevron-down" />
				</DropdownMenuTriggerButton>
			</TooltipWrapper>
			{/* .bottom-content-filter-dropdown-trigger removes padding */}
			{/* alignOffset is used to compensate, so text inside dropdown is vertically aligned with text outside */}
			<DropdownMenuContent align="start" alignOffset={-13}>
				<DropdownMenuRadioGroup onValueChange={(v) => onSelect(v as T)} value={value}>
					{values.map((value) => (
						<DropdownMenuRadioItem key={value} value={value}>
							{labels[value]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const TooltipWrapper = ({ tooltip, children }: { tooltip?: string; children: React.ReactNode }) => {
	if (!tooltip) {
		return children;
	}

	return (
		<Tooltip>
			<TooltipContent>
				<p>{tooltip}</p>
			</TooltipContent>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
		</Tooltip>
	);
};
