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
				<DropdownMenuCheckboxItem key={key} disabled={disabled} onSelect={onSelect} checked={checked}>
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
					<DropdownMenuContent ref={ref} align="start">
						{properties.map((property) => (
							<PropertyItem
								disabled={false}
								key={property.name}
								property={property}
								onClick={(name, value) => togglePropertyValue(name, value)}
								getItemComponent={getPropertyItemComponent}
							/>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	},
);
