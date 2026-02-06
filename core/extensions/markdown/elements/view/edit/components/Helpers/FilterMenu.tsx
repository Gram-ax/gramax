import t, { hasTranslation, TranslationKey } from "@ext/localization/locale/translate";
import { Mode, PropertyFilter } from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Item from "@ext/markdown/elements/view/edit/components/Helpers/Item";
import { enumTypes, isHasValue, Property } from "@ext/properties/models";
import { DropdownMenuRadioGroup } from "@ui-kit/Dropdown";
import { memo, ReactNode, useCallback } from "react";

interface FilterMenuProps {
	noAssignedProperties: PropertyFilter[];
	updateFilter: (name: string, value: string | string[]) => void;
	customPropertyMenu?: (
		property: Property,
		updateFilter: (name: string, value: string | string[]) => void,
	) => ReactNode;
	closeOnSelection: boolean;
	ignoreEmpty?: boolean;
	mode: Mode;
	availableValues: boolean;
}

const FilterMenu = memo((props: FilterMenuProps) => {
	const { noAssignedProperties, updateFilter, customPropertyMenu, mode, availableValues, ignoreEmpty } = props;

	const updateData = useCallback(
		(name: string, value?: string | string[]) => updateFilter(name, value),
		[updateFilter],
	);

	const renderer = useCallback(
		(property: Property) => customPropertyMenu?.(property, updateData),
		[customPropertyMenu, updateData],
	);

	const items = noAssignedProperties.map((property) => {
		const isNotEnum = !enumTypes.includes(property.type);
		const values = availableValues && isHasValue[property.type] ? property.values : undefined;
		const showChildren = (isNotEnum && availableValues && mode === "multiple") || customPropertyMenu;
		const translationKey: TranslationKey = `properties.system.${property.name}.name`;

		return (
			<Item
				buttons={
					isNotEnum &&
					availableValues && (
						<>
							<Item
								mode="multiple"
								name={t("properties.selected")}
								onClick={() => updateData(property.name, "yes")}
								selected={!property?.value?.includes("yes")}
								trigger={t("properties.selected")}
								value={!property?.value?.includes("yes") ? ["yes"] : undefined}
							/>
						</>
					)
				}
				ignoreEmpty={ignoreEmpty}
				key={property.name}
				mode={mode}
				name={property.name}
				onClick={(value) => updateData(property.name, value)}
				renderer={customPropertyMenu && showChildren ? () => renderer(property) : undefined}
				selected={property.selected}
				trigger={<div>{hasTranslation(translationKey) ? t(translationKey) : property.name}</div>}
				value={property.value}
				values={showChildren ? undefined : values}
			/>
		);
	});

	if (mode === "single") {
		return (
			<DropdownMenuRadioGroup
				indicatorIconPosition="start"
				onValueChange={(value) => updateData(value, value)}
				value={noAssignedProperties.find((property) => property.selected)?.name}
			>
				{noAssignedProperties.map((property) => (
					<Item
						key={property.name}
						mode="single"
						name={property.name}
						onClick={(value) => updateData(property.name, value)}
						trigger={<div>{property.name}</div>}
					/>
				))}
			</DropdownMenuRadioGroup>
		);
	}

	return items;
});

export default FilterMenu;
