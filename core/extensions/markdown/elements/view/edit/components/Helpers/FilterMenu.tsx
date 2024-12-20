import { Property, PropertyTypes } from "@ext/properties/models";
import { isHasValue } from "@ext/properties/models";
import PropertyItem from "@ext/properties/components/PropertyItem";
import PropertyButton from "@ext/properties/components/PropertyButton";
import t from "@ext/localization/locale/translate";
import { memo, MouseEvent, ReactNode, useCallback } from "react";
import { PropertyFilter } from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";

interface FilterMenuProps {
	noAssignedProperties: PropertyFilter[];
	updateFilter: (name: string, value: string | string[]) => void;
	customPropertyMenu?: (
		property: Property,
		updateFilter: (name: string, value: string | string[]) => void,
	) => ReactNode;
	closeOnSelection: boolean;
	specialValues: boolean;
	allowAddAll: boolean;
	availableValues: boolean;
}

const FilterMenu = memo((props: FilterMenuProps) => {
	const {
		noAssignedProperties,
		updateFilter,
		customPropertyMenu,
		closeOnSelection,
		specialValues,
		availableValues,
		allowAddAll,
	} = props;

	const updateData = useCallback(
		(name: string, value: string | string[]) => updateFilter(name, value),
		[updateFilter],
	);

	const filterUpdate = useCallback(
		(e: MouseEvent, name: string, value: string | string[]) => updateFilter(name, value),
		[updateFilter],
	);

	return noAssignedProperties.map((property) => {
		const customMenu = customPropertyMenu?.(property, updateData) || null;
		const isNotEnum = property.type !== PropertyTypes.enum;
		const values = availableValues && isHasValue[property.type] ? property.values : undefined;
		const showChildren = (isNotEnum && availableValues && specialValues) || customMenu;

		const noneUpdate = () => updateFilter(property.name, "none");
		const yesUpdate = () => updateFilter(property.name, "yes");

		return (
			<PropertyItem
				canMany
				hasAllProperty={specialValues}
				hasNoneProperty={!isNotEnum && specialValues}
				id={property.name}
				endIcon={property.selected && "check"}
				key={property.name}
				name={property.name}
				allowAddAll={allowAddAll}
				value={property.value}
				values={values}
				onClick={filterUpdate}
				closeOnSelection={closeOnSelection}
			>
				{showChildren && (
					<>
						{customMenu !== undefined && customMenu}
						{isNotEnum && availableValues && specialValues ? (
							<>
								<PropertyButton
									name={t("properties.selected")}
									canMany
									checked={!property?.value?.includes("yes")}
									onClick={yesUpdate}
								/>
								<PropertyButton
									name={t("properties.not-selected")}
									canMany
									checked={!property?.value?.includes("none")}
									onClick={noneUpdate}
								/>
							</>
						) : null}
					</>
				)}
			</PropertyItem>
		);
	});
});

export default FilterMenu;
