import { enumTypes, Property } from "@ext/properties/models";
import { isHasValue } from "@ext/properties/models";
import { memo, ReactNode, useCallback } from "react";
import { Mode, PropertyFilter } from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Item from "@ext/markdown/elements/view/edit/components/Helpers/Item";
import t, { hasTranslation, TranslationKey } from "@ext/localization/locale/translate";
import { DropdownMenuRadioGroup } from "@ui-kit/Dropdown";

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
				name={property.name}
				selected={property.selected}
				value={property.value}
				key={property.name}
				ignoreEmpty={ignoreEmpty}
				mode={mode}
				values={showChildren ? undefined : values}
				onClick={(value) => updateData(property.name, value)}
				renderer={customPropertyMenu && showChildren ? () => renderer(property) : undefined}
				buttons={
					isNotEnum &&
					availableValues && (
						<>
							<Item
								name={t("properties.selected")}
								selected={!property?.value?.includes("yes")}
								value={!property?.value?.includes("yes") ? ["yes"] : undefined}
								onClick={() => updateData(property.name, "yes")}
								trigger={t("properties.selected")}
								mode="multiple"
							/>
						</>
					)
				}
				trigger={<div>{hasTranslation(translationKey) ? t(translationKey) : property.name}</div>}
			/>
		);
	});

	if (mode === "single") {
		return (
			<DropdownMenuRadioGroup
				value={noAssignedProperties.find((property) => property.selected)?.name}
				onValueChange={(value) => updateData(value, value)}
				indicatorIconPosition="start"
			>
				{noAssignedProperties.map((property) => (
					<Item
						trigger={<div>{property.name}</div>}
						onClick={(value) => updateData(property.name, value)}
						name={property.name}
						key={property.name}
						mode="single"
					/>
				))}
			</DropdownMenuRadioGroup>
		);
	}

	return items;
});

export default FilterMenu;
