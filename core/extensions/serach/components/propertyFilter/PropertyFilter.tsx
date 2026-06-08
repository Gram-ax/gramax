import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import PropertiesScrollContainer from "@ext/properties/components/Helpers/PropertiesScrollContainer";
import type { Property } from "@ext/properties/models";
import type { FilterablePropertyItem } from "@ext/serach/components/propertyFilter/propertyFilterModel";
import { getPropertyValueLabel } from "@ext/serach/components/propertyFilter/propertyFilterModel";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { MenuItemIcon } from "@ui-kit/MenuItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface PropertyFilterProps {
	properties: FilterablePropertyItem[];
	togglePropertyValue: (name: string, value?: string) => void;
	selectAllPropertyValues: (name: string) => void;
	selectEmptyPropertyValue: (name: string) => void;
	className?: string;
}

export const PropertyFilter = (props: PropertyFilterProps) => {
	const { properties, togglePropertyValue, selectAllPropertyValues, selectEmptyPropertyValue, className } = props;
	return (
		<div className={className}>
			<DropdownMenu>
				<Tooltip>
					<TooltipContent>{t("search.property-filter-tooltip")}</TooltipContent>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<button className="search-icon" type="button">
								<Icon code="list-plus" />
							</button>
						</DropdownMenuTrigger>
					</TooltipTrigger>
				</Tooltip>
				<DropdownMenuContent align="start">
					<PropertiesScrollContainer>
						{properties.map((property) => (
							<PropertyWithSubmenu
								item={property}
								key={property.property.id}
								onClick={(name, value) => togglePropertyValue(name, value)}
								onEmptySelect={selectEmptyPropertyValue}
								onSelectAll={selectAllPropertyValues}
							/>
						))}
					</PropertiesScrollContainer>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

interface PropertyWithSubmenuProps {
	item: FilterablePropertyItem;
	onClick: (name: string, value?: string) => void;
	onSelectAll: (name: string) => void;
	onEmptySelect: (name: string) => void;
}

const PropertyWithSubmenu = (props: PropertyWithSubmenuProps) => {
	const { item, onClick, onSelectAll, onEmptySelect } = props;
	const { property, selection } = item;

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<PropertyFilterItemLabel property={property} />
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				<PropertiesScrollContainer>
					<DropdownMenuCheckboxItem
						checked={selection.allSelected}
						onSelect={(e) => {
							e.preventDefault();
							onSelectAll(property.id);
						}}
					>
						{t("properties.select-all")}
					</DropdownMenuCheckboxItem>
					<DropdownMenuCheckboxItem
						checked={selection.emptySelected}
						onSelect={(e) => {
							e.preventDefault();
							onEmptySelect(property.id);
						}}
					>
						{t("properties.empty")}
					</DropdownMenuCheckboxItem>
					{selection.options.map((option) => {
						return (
							<DropdownMenuCheckboxItem
								checked={option.selected}
								key={option.value}
								onSelect={(e) => {
									e.preventDefault();
									onClick(property.id, option.value);
								}}
							>
								{getPropertyValueLabel(property.type, option.value)}
							</DropdownMenuCheckboxItem>
						);
					})}
				</PropertiesScrollContainer>
			</DropdownMenuSubContent>
		</DropdownMenuSub>
	);
};

const PropertyFilterItemLabel = ({ property }: { property: Property }) => (
	<div className="flex items-center gap-2 w-full">
		<div className="w-4 h-4 shrink-0">{property.icon && <MenuItemIcon icon={property.icon} />}</div>
		{property.name}
	</div>
);
