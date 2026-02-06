import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import PropertyItem, { PropertyItemProps } from "@ext/properties/components/Helpers/PropertyItem";
import { Property } from "@ext/properties/models";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { forwardRef } from "react";

interface PropertyFilterProps {
	properties: Property[];
	filteredProperties: Property[];
	togglePropertyValue: (name: string, value?: string) => void;
}

export const PropertyFilter = forwardRef<HTMLDivElement, PropertyFilterProps>(
	({ properties, filteredProperties, togglePropertyValue }, ref) => {
		const getPropertyItemComponent: PropertyItemProps["getItemComponent"] = ({
			key,
			children,
			disabled,
			onSelect,
			item,
		}) => {
			let checked = false;
			filteredProperties.forEach((x) => {
				if (x.name === item.property.name) {
					checked = item.value == null || x.value?.some((y) => y === item.value);
				}
			});

			return (
				<DropdownMenuCheckboxItem checked={checked} disabled={disabled} key={key} onSelect={onSelect}>
					{children}
				</DropdownMenuCheckboxItem>
			);
		};

		return (
			<div>
				<DropdownMenu>
					<Tooltip>
						<TooltipContent>{t("search.property-filter-tooltip")}</TooltipContent>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<a className="search-icon">
									<Icon code="list-plus" />
								</a>
							</DropdownMenuTrigger>
						</TooltipTrigger>
					</Tooltip>
					<DropdownMenuContent align="start" ref={ref}>
						{properties.map((property) => (
							<PropertyItem
								disabled={false}
								getItemComponent={getPropertyItemComponent}
								key={property.name}
								onClick={(name, value) => togglePropertyValue(name, value)}
								property={property}
							/>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	},
);
