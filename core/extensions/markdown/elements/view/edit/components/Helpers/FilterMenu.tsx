import t, { hasTranslation, type TranslationKey } from "@ext/localization/locale/translate";
import type { Mode, PropertyFilter } from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import Item from "@ext/markdown/elements/view/edit/components/Helpers/Item";
import PropertiesScrollContainer from "@ext/properties/components/Helpers/PropertiesScrollContainer";
import { enumTypes, isHasValue, type Property } from "@ext/properties/models";
import { DropdownMenuRadioGroup } from "@ui-kit/Dropdown";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { memo, type ReactNode, useCallback } from "react";

interface FilterMenuProps {
	noAssignedProperties: PropertyFilter[];
	updateFilter: (propertyId: string, value: string | string[]) => void;
	customPropertyMenu?: (
		property: Property,
		updateFilter: (propertyId: string, value: string | string[]) => void,
	) => ReactNode;
	closeOnSelection: boolean;
	ignoreEmpty?: boolean;
	mode: Mode;
	availableValues: boolean;
}

const FilterMenu = memo((props: FilterMenuProps) => {
	const { noAssignedProperties, updateFilter, customPropertyMenu, mode, availableValues, ignoreEmpty } = props;

	const updateData = useCallback(
		(propertyId: string, value?: string | string[]) => updateFilter(propertyId, value),
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
		const translationKey: TranslationKey = `properties.system.${property.id}.name`;

		return (
			<Item
				buttons={
					isNotEnum &&
					availableValues && (
						<>
							<Item
								mode="multiple"
								name={t("properties.selected")}
								onClick={() => updateData(property.id, "yes")}
								selected={!property?.value?.includes("yes")}
								trigger={<TextOverflowTooltip>{t("properties.selected")}</TextOverflowTooltip>}
								value={!property?.value?.includes("yes") ? ["yes"] : undefined}
							/>
						</>
					)
				}
				ignoreEmpty={ignoreEmpty}
				key={property.id}
				mode={mode}
				name={property.name}
				onClick={(value) => updateData(property.id, value)}
				renderer={customPropertyMenu && showChildren ? () => renderer(property) : undefined}
				selected={property.selected}
				trigger={
					<TextOverflowTooltip>
						{hasTranslation(translationKey) ? t(translationKey) : property.name}
					</TextOverflowTooltip>
				}
				value={property.value}
				values={showChildren ? undefined : values}
			/>
		);
	});

	if (mode === "single") {
		return (
			<DropdownMenuRadioGroup
				indicatorIconPosition="end"
				onValueChange={(value) => updateData(value, value)}
				value={noAssignedProperties.find((property) => property.selected)?.id}
			>
				<PropertiesScrollContainer>
					{noAssignedProperties.map((property) => (
						<Item
							key={property.id}
							mode="single"
							name={property.name}
							onClick={(value) => updateData(property.id, value)}
							trigger={<TextOverflowTooltip>{property.name}</TextOverflowTooltip>}
						/>
					))}
				</PropertiesScrollContainer>
			</DropdownMenuRadioGroup>
		);
	}

	return items;
});

export default FilterMenu;
